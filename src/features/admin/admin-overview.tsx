'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { ArrowRight, BarChart3, CalendarDays, ClipboardCheck, Users, Wallet } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadError } from '@/components/ui/load-error';
import { Skeleton } from '@/components/ui/skeleton';
import { StatCard } from '@/components/ui/stat-card';
import { useAdminPendingCount, useAdminReports } from '@/hooks/use-admin';
import { formatBDT, formatNumber, toAppLocale } from '@/lib/format';
import { MonthlyChart } from './charts';

export function AdminOverview() {
  const locale = toAppLocale(useLocale());
  const t = useTranslations('admin.dashboard');
  const reports = useAdminReports();
  const pending = useAdminPendingCount();
  const data = reports.data;
  const thisMonth = data?.byMonth.at(-1)?.amount ?? '0';

  const links = [
    {
      href: `/${locale}/admin/donations`,
      icon: ClipboardCheck,
      title: 'reviewDonations',
      desc: 'reviewDonationsDesc',
    },
    { href: `/${locale}/admin/users`, icon: Users, title: 'manageUsers', desc: 'manageUsersDesc' },
    {
      href: `/${locale}/admin/reports`,
      icon: BarChart3,
      title: 'viewReports',
      desc: 'viewReportsDesc',
    },
  ] as const;

  return (
    <div className="flex flex-col gap-6">
      {reports.isError ? (
        <LoadError message={t('loadFailed')} onRetry={() => void reports.refetch()} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            icon={Wallet}
            label={t('totalRaised')}
            value={data && formatBDT(data.totals.totalRaised, locale)}
            hint={data && t('donors', { count: formatNumber(data.totals.totalDonors, locale) })}
            loading={reports.isLoading}
          />
          <StatCard
            icon={CalendarDays}
            label={t('thisMonth')}
            value={data && formatBDT(thisMonth, locale)}
            hint={data && t('today', { amount: formatBDT(data.totals.todayTotal, locale) })}
            loading={reports.isLoading}
          />
          <StatCard
            icon={ClipboardCheck}
            label={t('pendingReview')}
            value={pending.data !== undefined && formatNumber(pending.data, locale)}
            hint={
              pending.data ? (
                <Link href={`/${locale}/admin/donations`} className="font-semibold text-primary">
                  {t('reviewNow')} →
                </Link>
              ) : undefined
            }
            loading={pending.isLoading}
          />
          <StatCard
            icon={Users}
            label={t('users')}
            value={data && formatNumber(data.totals.totalUsers, locale)}
            loading={reports.isLoading}
          />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>{t('monthlyTrend')}</CardTitle>
          </CardHeader>
          <CardContent>
            {data ? (
              <MonthlyChart data={data.byMonth} locale={locale} />
            ) : (
              <Skeleton className="h-[260px] w-full" />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t('quickLinks')}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {links.map(({ href, icon: Icon, title, desc }) => (
              <Link
                key={href}
                href={href}
                className="group flex items-center gap-3 rounded-md border p-3 transition-colors hover:border-primary/50 hover:bg-primary-soft/40"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary-soft text-primary-soft-foreground">
                  <Icon className="size-5" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold">{t(title)}</span>
                  <span className="block truncate text-xs text-muted-foreground">{t(desc)}</span>
                </span>
                <ArrowRight
                  className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                  aria-hidden
                />
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
