/**
 * Server-side session helpers.
 *
 * requireCompletedProfile is intentionally NOT a redirect — there is no
 * /complete-profile page. Callers that need a complete profile should
 * either prompt the user inline (e.g. the donate page) or call
 * /api/users/complete-profile to mark it complete before proceeding.
 */
import { auth } from './next-auth';
import { UnauthorizedError, ForbiddenError } from '@/lib/errors';

export async function requireAuth() {
  const session = await auth();
  if (!session?.user) throw new UnauthorizedError();
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