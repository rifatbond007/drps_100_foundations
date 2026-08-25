/**
 * POST /api/auth/session/refresh
 *
 * Bumps the current user's `tokenVersion`. The NextAuth `jwt` callback
 * compares the DB tokenVersion against the one in the token and
 * invalidates the token when the DB value is higher — effectively
 * "log out all sessions for this user".
 *
 * - Requires authentication.
 * - Idempotent-ish: repeated calls just keep incrementing.
 * - Audited as ADMIN_ACTION if called by an admin targeting a different
 *   user (forwarded as ?userId=). Without ?userId= it only refreshes
 *   the calling user's own sessions (self-logout-all).
 */
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireAdmin } from '@/lib/auth/session';
import { ok, fail } from '@/lib/api/helpers';
import { ForbiddenError, ValidationError } from '@/lib/errors';
import { logSecurityEvent } from '@/lib/audit';
import { cuidSchema } from '@/lib/validation/common';

const QuerySchema = z.object({
  userId: cuidSchema.optional(),
});

export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    const url = new URL(request.url);
    const parsed = QuerySchema.safeParse(Object.fromEntries(url.searchParams));
    if (!parsed.success) {
      throw new ValidationError('Invalid query', { fieldErrors: parsed.error.flatten().fieldErrors });
    }

    const targetUserId = parsed.data.userId ?? session.user.id;

    // Self is always allowed. Targeting someone else requires admin.
    if (targetUserId !== session.user.id) {
      try {
        await requireAdmin();
      } catch {
        throw new ForbiddenError('Only admins can refresh other users\' sessions');
      }
    }

    const updated = await prisma.user.update({
      where: { id: targetUserId },
      data: { tokenVersion: { increment: 1 } },
      select: { id: true, tokenVersion: true },
    });

    await logSecurityEvent({
      action: 'ADMIN_ACTION',
      userId: session.user.id,
      resource: targetUserId,
      details: {
        type: 'SESSION_REFRESH_ALL',
        targetUserId,
        self: targetUserId === session.user.id,
        newTokenVersion: updated.tokenVersion,
      },
    });

    return ok({ userId: updated.id, tokenVersion: updated.tokenVersion });
  } catch (error) {
    return fail(error);
  }
}