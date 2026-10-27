/**
 * API route helpers — uniform success/error envelope.
 *
 * H5 (audit fix): In production, AppError.message is NEVER echoed to clients.
 * Instead we generate an `errorId` (cryptographically random) and:
 *  - Log the full message + stack + errorId server-side
 *  - Persist 5xx errors to AuditLog.correlationId so they can be looked
 *    up by the errorId in the client (e.g. via /api/admin/errors). This
 *    is the lifeline when Vercel log retention has rolled past the
 *    request — the DB persists indefinitely, and an admin can run
 *    `SELECT * FROM "AuditLog" WHERE "correlationId" = '<ref>'` directly
 *    on Neon to see the real cause.
 *  - Return only `code`, `errorId`, and a redacted `safeMessage` to the client
 * In development we still echo the raw message for DX.
 *
 * NOTE on the AuditLog write: it is fire-and-forget. We do NOT await the
 * insert in the response path — a slow DB write on the same connection
 * pool that just failed would only compound the user's outage. The
 * `.catch()` re-routes a write failure to the logger so we still see it.
 */
import { NextResponse } from 'next/server';
import { AppError, ValidationError } from '@/lib/errors';
import { ZodError, type z } from 'zod';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import type { ApiError, ApiSuccess } from '@/types/api';

// Read per call so tests (and any late env injection) see the current value.
const isProd = (): boolean => process.env.NODE_ENV === 'production';

/**
 * Persist a redacted fingerprint of an unhandled error to AuditLog so
 * the user can look it up via the errorId returned to the client.
 *
 * - `correlationId` is the same UUID we return to the client as `errorId`
 *   — so an admin who pastes the `ref …` suffix into
 *   `/api/admin/errors?errorId=...` finds the underlying message.
 * - We capture `error.name`, `error.message`, and `error.stack` (capped
 *   at 8 KB so a runaway stack doesn't blow the column) but NEVER the
 *   original Error object — it can carry request bodies, cookies, or
 *   session tokens via attached properties.
 * - The insert is intentionally not awaited in callers — see note above.
 */
function persistError(
  errorId: string,
  error: unknown,
  context: { route?: string; method?: string }
): void {
  const name = error instanceof Error ? error.name : 'UnknownError';
  const message = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack : undefined;

  // Cap stack so a runaway loop or huge polyfill doesn't blow the
  // `details` JSON column. 8 KB is plenty for triage; truncate with an
  // explicit marker so the reader knows it was clipped.
  const stackCapped =
    typeof stack === 'string' && stack.length > 8192
      ? `${stack.slice(0, 8192)}\n... [truncated at 8KB]`
      : stack;

  prisma.auditLog
    .create({
      data: {
        action: 'API_UNHANDLED_ERROR',
        severity: 'CRITICAL',
        correlationId: errorId,
        resource: context.route,
        details: {
          errorName: name,
          errorMessage: message,
          stack: stackCapped,
          method: context.method,
          route: context.route,
        },
      },
    })
    .catch((writeErr) => {
      // If the AuditLog insert itself blows up (e.g. DB unreachable),
      // we already know the user's original error path was bad. Don't
      // throw — just log loudly so ops can correlate.
      logger.error(
        { errorId, writeErr: writeErr instanceof Error ? writeErr.message : String(writeErr) },
        'persistError: failed to write AuditLog row'
      );
    });
}

/**
 * Parse a JSON request body through a zod schema. Malformed JSON is a
 * client error (400), never a 500. With `optional`, an empty body
 * parses as `{}`.
 */
export async function parseJsonBody<S extends z.ZodTypeAny>(
  request: Request,
  schema: S,
  opts: { optional?: boolean } = {}
): Promise<z.infer<S>> {
  const text = await request.text();
  if (!text.trim()) {
    if (opts.optional) return schema.parse({});
    throw new ValidationError('Request body is required');
  }
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    throw new ValidationError('Invalid JSON body');
  }
  return schema.parse(json);
}

/** Parse URL search params through a zod schema (ZodError → 400 via fail()). */
export function parseQuery<S extends z.ZodTypeAny>(url: URL | string, schema: S): z.infer<S> {
  const { searchParams } = typeof url === 'string' ? new URL(url) : url;
  return schema.parse(Object.fromEntries(searchParams));
}

export function ok<T>(data: T, init?: ResponseInit): NextResponse<ApiSuccess<T>> {
  return NextResponse.json({ success: true, data }, init);
}

function newErrorId(): string {
  return crypto.randomUUID();
}

export function fail(
  error: unknown,
  context?: { route?: string; method?: string }
): NextResponse<ApiError> {
  const ctx = context ?? { route: 'unknown', method: 'unknown' };
  // Validation: always client-safe (no PII in zod issues by design)
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Invalid input',
        details: error.flatten(),
      },
      { status: 400 }
    );
  }

  if (error instanceof AppError) {
    if (isProd()) {
      const errorId = newErrorId();
      const serverSide = error.statusCode >= 500;
      logger[serverSide ? 'error' : 'warn'](
        {
          errorId,
          code: error.code,
          statusCode: error.statusCode,
          message: error.message,
          stack: error.stack,
        },
        'AppError in API route'
      );
      // Only server-side failures go to the AuditLog; 4xx (auth, not
      // found, validation, rate limit) would otherwise flood it.
      if (serverSide) persistError(errorId, error, ctx);
      return NextResponse.json(
        {
          success: false,
          error: error.code,
          message: error.safeMessage,
          errorId,
        },
        { status: error.statusCode }
      );
    }
    // Dev: echo real message for DX
    return NextResponse.json(
      { success: false, error: error.code, message: error.message },
      { status: error.statusCode }
    );
  }

  // Unknown error: always opaque in prod
  if (isProd()) {
    const errorId = newErrorId();
    logger.error({ errorId, error }, 'Unhandled API error');
    persistError(errorId, error, ctx);
    return NextResponse.json(
      {
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Something went wrong',
        errorId,
      },
      { status: 500 }
    );
  }
  // Dev: include the real error string
  const message = error instanceof Error ? error.message : String(error);
  return NextResponse.json({ success: false, error: 'INTERNAL_ERROR', message }, { status: 500 });
}
