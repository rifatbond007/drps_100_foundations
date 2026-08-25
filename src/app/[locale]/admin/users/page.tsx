import { setRequestLocale } from 'next-intl/server';
import { UsersTable } from '@/components/admin/UsersTable';

/**
 * /admin/users — admin user list.
 *
 * No h1 / subtitle here on purpose: the layout already renders the
 * dashboard-style stat cards above the page content, and the page is
 * identifiable from the sidebar's Users link. Adding a redundant
 * "User management" + "All registered users" header duplicates info
 * the admin already sees in chrome.
 */
export default async function AdminUsersPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <UsersTable />;
}
