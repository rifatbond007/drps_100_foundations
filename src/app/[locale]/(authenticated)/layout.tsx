import { setRequestLocale } from 'next-intl/server';
import { redirect } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { requireAuth } from '@/lib/auth/session';

/**
 * Authenticated layout — guards all child routes.
 * - Requires login
 * - No longer redirects incomplete-profile users to /complete-profile.
 *   Profile fields (phone, languagePref) are collected lazily at point of
 *   use (e.g. when the user attempts to donate). The donate page calls
 *   /api/users/complete-profile as part of its submit flow.
 * - Reads session and forwards role to Sidebar so admin menu items only
 *   render for admins.
 */
export default async function AuthenticatedLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  let session;
  try {
    // requireAuth() throws UnauthorizedError if no session.
    session = await requireAuth();
  } catch {
    // No /login page — bounce to home, where the SignInButton kicks off Google OAuth.
    redirect(`/${locale}`);
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl gap-6 px-4 py-8">
      <Sidebar isAdmin={session.user.role === 'ADMIN'} />
      <div className="flex-1">{children}</div>
    </div>
  );
}
