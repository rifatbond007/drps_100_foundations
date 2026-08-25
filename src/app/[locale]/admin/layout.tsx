import { setRequestLocale } from 'next-intl/server';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth/next-auth';
import { Sidebar } from '@/components/layout/Sidebar';

/**
 * Admin layout — guards all /admin/* routes.
 * Requires role === 'ADMIN'.
 *
 * Layout strategy:
 *   - The site Header is `sticky top-0` with h-16 (4rem). Below it, this
 *     layout fills the remaining viewport (`h-[calc(100vh-4rem)]`) so
 *     the sidebar + main content share a fixed-height area that scrolls
 *     internally instead of pushing the whole page downward.
 *   - The Sidebar scrolls its nav internally (`overflow-y-auto` inside
 *     an `aside.h-full`) so a long user list never grows the page.
 *   - The main column gets `overflow-y-auto` so page content (Users
 *     table, Reports charts, Dashboard stat cards) scrolls within its
 *     own region while the sidebar stays pinned.
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
    <div className="mx-auto flex h-[calc(100vh-4rem)] w-full max-w-7xl gap-0 px-4 py-0">
      <Sidebar isAdmin />
      <main className="min-h-0 flex-1 overflow-y-auto px-4 py-8">{children}</main>
    </div>
  );
}
