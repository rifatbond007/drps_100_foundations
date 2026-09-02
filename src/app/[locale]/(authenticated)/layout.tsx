import { setRequestLocale } from 'next-intl/server';
import { redirect } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { requireAuth } from '@/lib/auth/session';

/**
 * Authenticated layout — guards all child routes.
 *
 * Two-column flex: the sidebar pinned at the document edge on the left,
 * the page content on the right. There is no sticky positioning on the
 * sidebar — it scrolls with the document so the footer can pin to the
 * bottom of long pages without creating a double scrollbar.
 *
 * The sidebar hides itself below md so phones see only the page content
 * with mobile menu controls inside Header.
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
    <div className="container flex w-full gap-8 py-8">
      <Sidebar isAdmin={session.user.role === 'ADMIN'} />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
