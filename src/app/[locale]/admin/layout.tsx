import { setRequestLocale } from 'next-intl/server';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth/next-auth';
import { Sidebar } from '@/components/layout/Sidebar';

/**
 * Admin layout — guards all /admin/* routes.
 * Requires role === 'ADMIN'.
 *
 * The locale layout locks <body> to exactly 100dvh and gives <main>
 * `h-[90vh] overflow-y-auto`. This layout fills the main scroll region
 * with a 2-column flex container: a sticky sidebar on the left and the
 * page content on the right. The content column does NOT add its own
 * scroll — <main> handles that — to avoid a double scrollbar.
 *
 * Outer wrapper uses the same `container` class as the navbar so the
 * admin row matches the navbar's width on wide screens.
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
    <div className="container flex h-full w-full gap-0">
      <Sidebar isAdmin />
      <div className="min-h-0 flex-1 py-4">{children}</div>
    </div>
  );
}
