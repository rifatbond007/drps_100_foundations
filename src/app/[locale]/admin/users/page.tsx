import { setRequestLocale, getTranslations } from 'next-intl/server';
import { UsersTable } from '@/components/admin/UsersTable';

/**
 * /admin/users — admin user list.
 * Hosts the table component, which carries its own header inside.
 */
export default async function AdminUsersPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('admin.users');

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t('subtitle')}</p>
      </header>
      <UsersTable />
    </div>
  );
}
