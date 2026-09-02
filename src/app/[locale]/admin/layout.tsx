import { setRequestLocale } from 'next-intl/server';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth/next-auth';
import { Sidebar } from '@/components/layout/Sidebar';

/**
 * Admin layout — guards all /admin/* routes. Requires role === 'ADMIN'.
 *
 * Same two-column structure as the authenticated layout, but the sidebar
 * is the admin variant of the nav items. Pages render inside the right
 * column with their own padding so they align with the rest of the app.
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
    <div className="container flex w-full flex-col gap-6 py-6 md:flex-row md:gap-8 md:py-8">
      <Sidebar isAdmin />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
