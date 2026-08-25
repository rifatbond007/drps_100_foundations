import { redirect } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';

/**
 * /admin root — redirects to /admin/users.
 *
 * The AdminLayout (parent) has already verified role=ADMIN, so this is
 * purely a "where should the admin land first" decision. We pick Users
 * because it's the page admins visit most often.
 */
export default async function AdminIndex({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  redirect(`/${locale}/admin/users`);
}
