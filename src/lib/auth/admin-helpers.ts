/**
 * Shared helpers for /api/admin/users/[id]/* routes.
 *
 * Centralizes:
 *   - cuid validation on the path id
 *   - "you cannot operate on yourself" guard (preventing self-lockout / self-demote)
 *   - "user not found" -> NotFoundError mapping
 *
 * IMPORTANT: callers must invoke `requireAdminTargetUser` BEFORE
 * `rateLimit(...)` so that an attacker spamming their own id can't burn
 * the admin's rate-limit quota before being rejected.
 */
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { NotFoundError, ValidationError } from '@/lib/errors';
import { ConflictError } from '@/lib/errors';

export const userIdSchema = z.string().cuid('Invalid user id');

/**
 * Look up a user by id, throwing typed errors that map cleanly to the
 * standard API envelope. Excludes soft-deleted users.
 */
export async function requireAdminTargetUser(targetUserId: string, actorId: string) {
  if (!userIdSchema.safeParse(targetUserId).success) {
    throw new ValidationError('Invalid user id');
  }
  if (targetUserId === actorId) {
    throw new ConflictError('You cannot perform this action on your own account');
  }
  const user = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: { id: true, role: true, isBanned: true, deletedAt: true, email: true },
  });
  if (!user || user.deletedAt) throw new NotFoundError('User not found');
  return user;
}
