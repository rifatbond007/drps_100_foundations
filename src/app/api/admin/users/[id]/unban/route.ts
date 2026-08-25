/**
 * DELETE /api/admin/users/[id]/unban — unban a user.
 *
 * Side effects:
 *   - Clear isBanned, bannedAt, bannedReason
 *   - Bump tokenVersion to invalidate any leaked JWT from the ban period
 *   - Audit log USER_UNBANNED
 */
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth/session';
import { requireAdminTargetUser } from '@/lib/auth/admin-helpers';
import { ok, fail } from '@/lib/api/helpers';
import { rateLimit, requireRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { logSecurityEvent } from '@/lib/audit';

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAdmin();
    const { id } = await params;

    // Self-target + existence checks run BEFORE rate-limit so spamming your
    // own id doesn't burn the admin's quota.
    const target = await requireAdminTargetUser(id, session.user.id);

    const rl = await rateLimit(
      `admin:users:unban:${session.user.id}`,
      RATE_LIMITS.ADMIN_ACTION.max,
      RATE_LIMITS.ADMIN_ACTION.windowSeconds
    );
    requireRateLimit(rl);

    if (!target.isBanned) {
      return ok({ id: target.id, isBanned: false, alreadyUnbanned: true });
    }

    const updated = await prisma.user.update({
      where: { id: target.id },
      data: {
        isBanned: false,
        bannedAt: null,
        bannedReason: null,
        tokenVersion: { increment: 1 },
      },
      select: { id: true, isBanned: true, bannedAt: true, bannedReason: true },
    });

    await logSecurityEvent({
      action: 'USER_UNBANNED',
      userId: target.id,
      resource: target.id,
      details: { actorId: session.user.id },
    });

    return ok(updated);
  } catch (error) {
    return fail(error);
  }
}
