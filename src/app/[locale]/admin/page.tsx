import { redirect } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';

/**
 * /admin root — redirects to /admin/dashboard.
 *
 * The AdminLayout (parent) has already verified role=ADMIN, so this is
 * purely a "where should the admin land first" decision. We pick the
 * dashboard because it's the canonical landing view with the live stat
 * cards + shortcuts to Users / Reports.
 */
export default async function AdminIndex({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  redirect(`/${locale}/admin/dashboard`);
}
