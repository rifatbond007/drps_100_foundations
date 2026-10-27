import { setRequestLocale } from 'next-intl/server';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth/next-auth';
import { AppShell } from '@/components/layout/app-shell';

/** Signed-in donor pages. Middleware already redirects signed-out visitors. */
export default async function AppLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await auth();
  if (!session?.user?.id) redirect(`/${locale}/login`);

  const { name, email, image, role } = session.user;
  return (
    <AppShell user={{ name: name ?? email ?? '', email: email ?? '', image, role }}>
      {children}
    </AppShell>
  );
}
