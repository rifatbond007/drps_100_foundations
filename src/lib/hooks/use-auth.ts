/**
 * Hook for accessing auth state in client components.
 * For server components, use auth() from @/lib/auth/next-auth.
 */
'use client';

import { useSession } from 'next-auth/react';

export function useAuth() {
  const { data: session, status } = useSession();
  return {
    user: session?.user,
    isLoading: status === 'loading',
    isAuthenticated: status === 'authenticated',
    isAdmin: session?.user?.role === 'ADMIN',
  };
}
