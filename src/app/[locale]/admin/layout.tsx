import { setRequestLocale } from 'next-intl/server';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth/next-auth';
import { Sidebar } from '@/components/layout/Sidebar';

/**
 * Admin layout — guards all /admin/* routes.
 * Requires role === 'ADMIN'.
 *
 * Height (100vh) is controlled by the locale layout (body is locked to
 * h-screen with overflow-hidden; <main> is flex-1 with internal scroll).
 * Width is whatever the main area gives it. This layout just fills the
 * scroll region with a 2-column flex container (sidebar + page content).
 */
export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await auth();
  if (!session?.user) redirect(`/${locale}/login`);
  if (session.user.role !== 'ADMIN') redirect(`/${locale}/dashboard`);

  return (
    <div className="mx-auto flex h-full w-full max-w-7xl gap-0 px-4">
      <Sidebar isAdmin />
      <div className="min-h-0 flex-1 overflow-y-auto py-8">{children}</div>
    </div>
  );
}
