/**
 * POST /api/admin/users/[id]/ban — ban a user.
 *
 * Body: { reason: string (>=10 chars) }
 * Side effects:
 *   - Set isBanned=true, bannedAt, bannedReason
 *   - Bump tokenVersion to invalidate all active JWTs (forces re-login)
 *   - Audit log USER_BANNED
 */
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth/session';
import { requireAdminTargetUser } from '@/lib/auth/admin-helpers';
import { ok, fail } from '@/lib/api/helpers';
import { rateLimit, requireRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { logSecurityEvent } from '@/lib/audit';
import { ValidationError } from '@/lib/errors';

const bodySchema = z.object({
  reason: z.string().trim().min(10, 'Reason must be at least 10 characters').max(500),
});

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAdmin();
    const { id } = await params;

    const rl = await rateLimit(
      `admin:users:ban:${session.user.id}`,
      RATE_LIMITS.ADMIN_ACTION.max,
      RATE_LIMITS.ADMIN_ACTION.windowSeconds
    );
    requireRateLimit(rl);

    const target = await requireAdminTargetUser(id, session.user.id);
    if (target.isBanned) {
      return ok({ id: target.id, isBanned: true, alreadyBanned: true });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      throw new ValidationError('Invalid JSON body');
    }
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return fail(
        new z.ZodError(parsed.error.issues.map((i) => ({ ...i, path: ['body', ...i.path] })))
      );
    }

    const updated = await prisma.user.update({
      where: { id: target.id },
      data: {
        isBanned: true,
        bannedAt: new Date(),
        bannedReason: parsed.data.reason,
        tokenVersion: { increment: 1 },
      },
      select: { id: true, isBanned: true, bannedAt: true, bannedReason: true },
    });

    await logSecurityEvent({
      action: 'USER_BANNED',
      userId: target.id,
      resource: target.id,
      details: { actorId: session.user.id, reason: parsed.data.reason },
    });

    return ok(updated);
  } catch (error) {
    return fail(error);
  }
}
