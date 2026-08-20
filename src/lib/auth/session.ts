/**
 * Server-side session helpers.
 */
import { auth } from './next-auth';
import { redirect } from 'next/navigation';
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
    redirect('/complete-profile');
  }
  return session;
}

export async function getOptionalSession() {
  return auth();
}
