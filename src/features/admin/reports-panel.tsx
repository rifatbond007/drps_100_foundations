'use client';

import { useLocale, useTranslations } from 'next-intl';
import { BarChart3, Download, Percent, Receipt, Users, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadError } from '@/components/ui/load-error';
import { Skeleton } from '@/components/ui/skeleton';
import { StatCard } from '@/components/ui/stat-card';
import { useAdminReports } from '@/hooks/use-admin';
import { formatBDT, formatNumber, toAppLocale } from '@/lib/format';
import { MonthlyChart, PurposeChart } from './charts';

export function ReportsPanel() {
  const locale = toAppLocale(useLocale());
  const t = useTranslations('admin.reports');
  const reports = useAdminReports();
  const data = reports.data;

  if (reports.isError)
    return <LoadError message={t('loadFailed')} onRetry={() => void reports.refetch()} />;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-end">
        <Button asChild variant="outline">
          <a href="/api/admin/reports?format=csv" download>
            <Download aria-hidden />
            {t('exportCsv')}
          </a>
        </Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Wallet}
          label={t('totalRaised')}
          value={data && formatBDT(data.totals.totalRaised, locale)}
          loading={!data}
        />
        <StatCard
          icon={Users}
          label={t('totalDonors')}
          value={data && formatNumber(data.totals.totalDonors, locale)}
          loading={!data}
        />
        <StatCard
          icon={Receipt}
          label={t('totalDonations')}
          value={data && formatNumber(data.totals.totalDonations, locale)}
          loading={!data}
        />
        <StatCard
          icon={Percent}
          label={t('successRate')}
          value={data && `${formatNumber(data.totals.successRate, locale)}%`}
          loading={!data}
        />
      </div>
      {!data ? (
        <Skeleton className="h-80 w-full rounded-lg" />
      ) : Number(data.totals.totalRaised) === 0 ? (
        <EmptyState icon={BarChart3} title={t('empty')} />
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>{t('byMonth')}</CardTitle>
            </CardHeader>
            <CardContent>
              <MonthlyChart data={data.byMonth} locale={locale} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>{t('byPurpose')}</CardTitle>
            </CardHeader>
            <CardContent>
              <PurposeChart
                locale={locale}
                data={data.byPurpose.map((p) => ({
                  label: t(`purposes.${p.purpose}`),
                  amount: Number(p.amount),
                }))}
              />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
