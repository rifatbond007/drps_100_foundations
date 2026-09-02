/**
 * GET /api/admin/errors
 *
 * Admin-only lookup for unhandled API errors that were persisted to
 * AuditLog by `fail()` in production. The user-facing client surfaces
 * an `errorId` as the `(ref <uuid>)` suffix of an opaque message —
 * pasting that uuid here reveals the underlying error message + stack
 * so ops can triage without needing psql / Vercel log access.
 *
 * Query params:
 *   ?errorId=<uuid>  → return the matching single error (most common path)
 *   ?limit=N         → return the N most recent unhandled errors (default 20,
 *                      max 100). Useful to spot a recurring cause.
 *
 * Security: this endpoint exposes server-side error stacks. It is
 * strictly admin-gated (requireAdmin) and rate-limited to RATE_LIMITS.ADMIN_ACTION
 * to keep the surface area small.
 */
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth/session';
import { ok, fail } from '@/lib/api/helpers';
import { rateLimit, requireRateLimit, RATE_LIMITS } from '@/lib/rate-limit';

const querySchema = z.object({
  errorId: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export async function GET(request: NextRequest) {
  try {
    const session = await requireAdmin();

    const rl = await rateLimit(
      `admin:errors:lookup:${session.user.id}`,
      RATE_LIMITS.ADMIN_ACTION.max,
      RATE_LIMITS.ADMIN_ACTION.windowSeconds
    );
    requireRateLimit(rl);

    const url = new URL(request.url);
    const parsed = querySchema.safeParse(Object.fromEntries(url.searchParams.entries()));
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'Invalid query parameters',
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { errorId, limit } = parsed.data;

    const where = { action: 'API_UNHANDLED_ERROR' as const };

    // Single-error lookup path — the common case when a user pastes
    // "ref acbd7eac-..." into the chat. We match by correlationId
    // (the column where fail() stored the errorId).
    if (errorId) {
      const row = await prisma.auditLog.findFirst({
        where: { ...where, correlationId: errorId },
        orderBy: { createdAt: 'desc' },
      });
      if (!row) {
        return NextResponse.json(
          {
            success: false,
            error: 'NOT_FOUND',
            message: `No error record found for errorId ${errorId}. The error may have predated this fix or never reached the persistError hook.`,
          },
          { status: 404 }
        );
      }
      return ok({
        errorId,
        action: row.action,
        severity: row.severity,
        createdAt: row.createdAt.toISOString(),
        route: row.resource,
        // `details` is Json? → cast safely; JSON columns in Prisma
        // round-trip as plain objects.
        details: row.details,
      });
    }

    // List path — most-recent N unhandled errors for an at-a-glance
    // view of "what's broken right now".
    const rows = await prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        correlationId: true,
        resource: true,
        severity: true,
        createdAt: true,
        details: true,
      },
    });

    return ok({
      count: rows.length,
      errors: rows.map((r) => ({
        errorId: r.correlationId,
        route: r.resource,
        severity: r.severity,
        createdAt: r.createdAt.toISOString(),
        errorName:
          typeof r.details === 'object' && r.details !== null
            ? (r.details as Record<string, unknown>).errorName
            : null,
        errorMessage:
          typeof r.details === 'object' && r.details !== null
            ? (r.details as Record<string, unknown>).errorMessage
            : null,
      })),
    });
  } catch (error) {
    return fail(error, { route: 'admin/errors', method: 'GET' });
  }
}
