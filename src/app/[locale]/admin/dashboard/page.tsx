import Link from 'next/link';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { Users, BarChart } from 'lucide-react';
import { CardDescription, CardTitle } from '@/components/ui/card';
import { AdminStatsCard } from '@/components/admin/AdminStatsCard';
import { AdminTotalsLive } from '@/components/admin/AdminTotalsLive';

/**
 * /admin/dashboard — landing page for admins.
 *
 * Renders three live stat cards (Total users / Total raised / Today's
 * donations) plus two shortcut cards linking to Users and Reports. The
 * stat values come from `AdminTotalsLive` (client component backed by
 * TanStack Query with staleTime: 0 and refetchOnMount: 'always') so the
 * dashboard reflects new donations the moment they land — no hard
 * refresh required.
 *
 * The two shortcut cards below still link to the dedicated admin pages.
 */
export default async function AdminDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const safeLocale: 'bn' | 'en' = locale === 'en' ? 'en' : 'bn';
  const t = await getTranslations('admin.dashboard');

  return (
    <div className="space-y-6">
      <AdminTotalsLive locale={safeLocale} />

      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href={`/${locale}/admin/users`}
          className="group rounded-lg border bg-card p-5 transition-colors hover:bg-accent"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base group-hover:underline">{t('manageUsers')}</CardTitle>
              <CardDescription className="text-xs">{t('manageUsersDesc')}</CardDescription>
            </div>
          </div>
        </Link>

        <Link
          href={`/${locale}/admin/reports`}
          className="group rounded-lg border bg-card p-5 transition-colors hover:bg-accent"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
              <BarChart className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base group-hover:underline">{t('viewReports')}</CardTitle>
              <CardDescription className="text-xs">{t('viewReportsDesc')}</CardDescription>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}

// `AdminStatsCard` is still re-exported for backwards-compat with tests
// that imported it from this module path. The dashboard itself uses
// `AdminTotalsLive` for live updates.
export { AdminStatsCard };
