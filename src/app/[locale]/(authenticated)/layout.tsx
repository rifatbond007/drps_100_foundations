import { setRequestLocale } from 'next-intl/server';
import { redirect } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { requireAuth } from '@/lib/auth/session';

/**
 * Authenticated layout — guards all child routes.
 * - Requires login
 * - Incomplete profile → /complete-profile
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
    redirect(`/${locale}/login`);
  }

  if (!session.user.profileCompleted) {
    redirect(`/${locale}/complete-profile`);
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl gap-6 px-4 py-8">
      <Sidebar />
      <div className="flex-1">{children}</div>
    </div>
  );
}
