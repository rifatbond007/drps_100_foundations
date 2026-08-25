import { setRequestLocale } from 'next-intl/server';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth/next-auth';
import { Sidebar } from '@/components/layout/Sidebar';

/**
 * Admin layout — guards all /admin/* routes.
 * Requires role === 'ADMIN'.
 *
 * Wraps children with the admin sidebar so navigation between
 * /admin/dashboard, /admin/users, /admin/reports keeps the admin
 * chrome visible. The dashboard stat cards live on the dashboard page
 * itself (not here) so the cards don't repeat on every admin view.
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
    <div className="mx-auto flex w-full max-w-7xl gap-6 px-4 py-8">
      <Sidebar isAdmin />
      <div className="flex-1">{children}</div>
    </div>
  );
}
