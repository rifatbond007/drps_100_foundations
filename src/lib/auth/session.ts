/**
 * Server-side session helpers.
 *
 * requireCompletedProfile is intentionally NOT a redirect — there is no
 * /complete-profile page. Callers that need a complete profile should
 * either prompt the user inline (e.g. the donate page) or call
 * /api/users/complete-profile to mark it complete before proceeding.
 */
import { auth } from './next-auth';
import { prisma } from '@/lib/prisma';
import { UnauthorizedError, ForbiddenError } from '@/lib/errors';

export async function requireAuth() {
  const session = await auth();
  if (!session?.user) throw new UnauthorizedError();
  return session;
}

/**
 * Re-check the user row in the DB before granting access. The JWT callback
 * throttles ban-check / token-version checks to once per 60s, so a freshly
 * banned or soft-deleted user can still hit protected routes for up to that
 * window. requireActiveUser closes that window for sensitive operations by
 * doing the DB lookup synchronously.
 */
export async function requireActiveUser() {
  const session = await requireAuth();
  if (!session.user.id) throw new UnauthorizedError();
  const row = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isBanned: true, deletedAt: true },
  });
  if (!row || row.deletedAt) throw new UnauthorizedError();
  if (row.isBanned) throw new ForbiddenError('Account is banned');
  return session;
}

export async function requireAdmin() {
  const session = await requireAuth();
  if (session.user.role !== 'ADMIN') throw new ForbiddenError('Admin access required');
  return session;
}

export async function requireCompletedProfile() {
  const session = await requireAuth();
  if (!session.user.profileCompleted) {
    throw new UnauthorizedError('Profile incomplete — please complete your profile first.');
  }
  return session;
}

export async function getOptionalSession() {
  return auth();
}
