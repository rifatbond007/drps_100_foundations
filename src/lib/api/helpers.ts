/**
 * API route helpers — uniform success/error envelope.
 *
 * H5 (audit fix): In production, AppError.message is NEVER echoed to clients.
 * Instead we generate an `errorId` (cryptographically random) and:
 *  - Log the full message + stack + errorId server-side
 *  - Persist the full error to AuditLog.correlationId so it can be looked
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
import { AppError } from '@/lib/errors';
import { ZodError } from 'zod';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';

const IS_PROD = process.env.NODE_ENV === 'production';

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

export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiError {
  success: false;
  error: string;
  message: string;
  errorId?: string;
  details?: unknown;
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
    if (IS_PROD) {
      const errorId = newErrorId();
      logger.error(
        {
          errorId,
          code: error.code,
          statusCode: error.statusCode,
          message: error.message,
          stack: error.stack,
        },
        'AppError in API route'
      );
      persistError(errorId, error, ctx);
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
  if (IS_PROD) {
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
