/**
 * Admin reports panel — charts only.
 *
 * Fetches /api/admin/reports and renders:
 *   - By-purpose bar chart (recharts)
 *   - By-month line chart (last 12 months)
 *   - CSV export button + manual refresh
 *
 * Data is loaded through the `useAdminReports` TanStack Query hook with
 * staleTime: 0 and refetchOnMount: 'always'. That means every time the
 * panel mounts — including back-navigation from another admin route — the
 * query re-runs and the charts reflect the latest donations without
 * needing a hard refresh. The default 60s staleTime set globally in
 * Providers.tsx is too long for live admin analytics.
 *
 * The lifetime stat cards (Total users / Total raised / Today's
 * donations) live in /admin/dashboard (server component) above all
 * admin pages, so this panel intentionally omits them to avoid
 * duplication.
 */
'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Download, RefreshCw } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ApiClientError } from '@/lib/api/errors';
import { useAdminReports } from '@/lib/hooks/use-admin-reports';
import { formatBDT } from '@/lib/utils';

const PURPOSE_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--destructive))',
  'hsl(220 70% 50%)',
  'hsl(160 60% 45%)',
];

export function ReportsPanel() {
  const rawLocale = useLocale();
  const locale = (rawLocale === 'bn' || rawLocale === 'en' ? rawLocale : 'bn') as 'bn' | 'en';
  const t = useTranslations('admin.reports');
  const { data, error, isLoading, isFetching, refetch } = useAdminReports();

  const exportCsv = () => {
    window.open('/api/admin/reports?format=csv', '_blank');
  };

  if (isLoading) {
    return <div className="text-muted-foreground">{t('loading')}</div>;
  }
  if (error) {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
        {t('error')}: {error instanceof ApiClientError ? error.message : error.message}
      </div>
    );
  }
  if (!data) return null;

  const isEmpty = data.totals.totalDonations === 0;

  if (isEmpty) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">{t('empty')}</CardContent>
      </Card>
    );
  }

  const purposeChart = data.byPurpose.map((p) => ({
    name: p.purpose,
    label: t(`purposes.${p.purpose}` as const) ?? p.purpose,
    amount: Number(p.amount),
    count: p.count,
  }));

  const monthChart = data.byMonth.map((m) => ({
    month: m.month,
    amount: Number(m.amount),
    count: m.count,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => void refetch()}
          disabled={isFetching}
          aria-label={t('refresh')}
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
          {t('refresh')}
        </Button>
        <Button variant="outline" size="sm" onClick={exportCsv}>
          <Download className="mr-2 h-4 w-4" />
          {t('exportCsv')}
        </Button>
      </div>

      {/* By purpose */}
      <Card>
        <CardHeader>
          <CardTitle>{t('byPurpose')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={purposeChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="label"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  tickFormatter={(v) => `৳${v}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 6,
                  }}
                  formatter={(v: number) => [formatBDT(String(v), locale), '']}
                />
                <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                  {purposeChart.map((_, i) => (
                    <Cell key={i} fill={PURPOSE_COLORS[i % PURPOSE_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* By month */}
      <Card>
        <CardHeader>
          <CardTitle>
            {t('byMonth')}{' '}
            <span className="text-sm font-normal text-muted-foreground">({t('months')})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="month"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  tickFormatter={(v) => `৳${v}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 6,
                  }}
                  formatter={(v: number) => [formatBDT(String(v), locale), '']}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="amount"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                  name={t('totalRaised')}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
