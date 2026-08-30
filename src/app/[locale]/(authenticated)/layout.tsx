import { setRequestLocale } from 'next-intl/server';
import { redirect } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { requireAuth } from '@/lib/auth/session';

/**
 * Authenticated layout — guards all child routes.
 *
 * The locale layout already locks <body> to h-screen with overflow-
 * hidden and gives <main> `min-h-0 flex-1 overflow-y-auto`. This
 * layout fills that scroll region with a 2-column flex container
 * (sidebar + page content). Width is whatever the main area gives it
 * (full width minus the sidebar); height is constrained to 100vh by
 * the locale layout so only the inner columns scroll vertically.
 *
 * No longer redirects incomplete-profile users to /complete-profile —
 * profile fields are collected lazily at point of use (the donate page
 * calls /api/users/complete-profile as part of its submit flow).
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
    session = await requireAuth();
  } catch {
    redirect(`/${locale}`);
  }

  return (
    <div className="mx-auto flex h-full w-full max-w-7xl gap-0 px-4">
      <Sidebar isAdmin={session.user.role === 'ADMIN'} />
      <div className="min-h-0 flex-1 overflow-y-auto py-8">{children}</div>
    </div>
  );
}
