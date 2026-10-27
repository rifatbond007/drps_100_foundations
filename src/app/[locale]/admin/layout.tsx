import { setRequestLocale } from 'next-intl/server';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth/next-auth';
import { AppShell } from '@/components/layout/app-shell';

/** Admin pages. Middleware already enforces the role; this is the server-side backstop. */
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
  if (!session?.user?.id) redirect(`/${locale}/login`);
  if (session.user.role !== 'ADMIN') redirect(`/${locale}/dashboard`);

  const { name, email, image } = session.user;
  return (
    <AppShell user={{ name: name ?? email ?? '', email: email ?? '', image, role: 'ADMIN' }}>
      {children}
    </AppShell>
  );
}
