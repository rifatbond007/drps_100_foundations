import { setRequestLocale } from 'next-intl/server';
import { redirect } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { requireAuth } from '@/lib/auth/session';

/**
 * Authenticated layout — guards all child routes.
 *
 * The locale layout locks <body> to exactly 100dvh and gives <main>
 * `h-[90vh] overflow-y-auto` — that's the only scrollable surface on
 * the page. This layout fills the main scroll region with a 2-column
 * flex container: a sticky sidebar pinned to the navbar's bottom edge
 * on the left, and the page content on the right.
 *
 * Important: the content column does NOT add its own overflow-y-auto.
 * The parent <main> already scrolls, and nesting another scrollable
 * region would create a double scrollbar. Pages here flow vertically
 * inside <main>; the sidebar scrolls internally only if its own nav
 * list grows taller than 90vh.
 *
 * The outer wrapper uses the same `container` class as the navbar, so
 * the sidebar + content row has the same max-width (1280px) and the
 * same horizontal padding as the navbar above it — on wide screens
 * the dashboard no longer stretches edge-to-edge.
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
    <div className="container flex h-full w-full gap-0">
      <Sidebar isAdmin={session.user.role === 'ADMIN'} />
      <div className="min-h-0 flex-1 py-4">{children}</div>
    </div>
  );
}
