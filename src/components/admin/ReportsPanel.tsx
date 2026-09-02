/**
 * Admin reports panel — charts only.
 *
 * Fetches /api/admin/reports and renders two charts (by-purpose bar,
 * by-month line) plus CSV export + manual refresh. Charts live in
 * hairline-bordered containers instead of cards with shadows.
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
import { ApiClientError } from '@/lib/api/errors';
import { useAdminReports } from '@/lib/hooks/use-admin-reports';
import { formatBDT } from '@/lib/utils';

const PURPOSE_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--admin))',
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
    return <p className="text-sm text-muted-foreground">{t('loading')}</p>;
  }
  if (error) {
    return (
      <p className="border-l-2 border-destructive bg-destructive/5 px-3 py-2 text-sm text-destructive">
        {t('error')}: {error instanceof ApiClientError ? error.message : error.message}
      </p>
    );
  }
  if (!data) return null;

  const isEmpty = data.totals.totalDonations === 0;

  if (isEmpty) {
    return <p className="py-12 text-center text-sm text-muted-foreground">{t('empty')}</p>;
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
      <div className="flex flex-wrap items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => void refetch()}
          disabled={isFetching}
          className="inline-flex h-9 items-center border border-input bg-background px-3 text-sm font-medium hover:bg-accent disabled:pointer-events-none disabled:opacity-50"
          aria-label={t('refresh')}
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
          {t('refresh')}
        </button>
        <button
          type="button"
          onClick={exportCsv}
          className="inline-flex h-9 items-center border border-input bg-background px-3 text-sm font-medium hover:bg-accent"
        >
          <Download className="mr-2 h-4 w-4" />
          {t('exportCsv')}
        </button>
      </div>

      <section>
        <h2 className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {t('byPurpose')}
        </h2>
        <div className="h-72 w-full border border-border bg-background p-3">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={purposeChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="label"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                interval={0}
                angle={-30}
                textAnchor="end"
                height={60}
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
                  borderRadius: 4,
                }}
                formatter={(v: number) => [formatBDT(String(v), locale), '']}
              />
              <Bar dataKey="amount" radius={[2, 2, 0, 0]}>
                {purposeChart.map((_, i) => (
                  <Cell key={i} fill={PURPOSE_COLORS[i % PURPOSE_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {t('byMonth')} <span className="text-muted-foreground/70">({t('months')})</span>
        </h2>
        <div className="h-72 w-full border border-border bg-background p-3">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="month"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                interval="preserveStartEnd"
                angle={-30}
                textAnchor="end"
                height={50}
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
                  borderRadius: 4,
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
      </section>
    </div>
  );
}
