/**
 * Admin reports panel.
 *
 * Fetches /api/admin/reports and renders:
 *   - 3 top stat cards (total raised, donors, success rate)
 *   - By-purpose bar chart (recharts)
 *   - By-month line chart (last 12 months)
 *   - CSV export button
 */
'use client';

import { useEffect, useState } from 'react';
import { useLocale } from 'next-intl';
import { Download } from 'lucide-react';
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { apiClient } from '@/lib/api/client';
import { ApiClientError } from '@/lib/api/errors';
import { formatBDT } from '@/lib/utils';

interface Reports {
  totals: {
    totalRaised: string;
    totalDonations: number;
    totalDonors: number;
    successRate: number;
  };
  byPurpose: { purpose: string; amount: string; count: number }[];
  byMonth: { month: string; amount: string; count: number }[];
}

const PURPOSE_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--destructive))',
  'hsl(220 70% 50%)',
  'hsl(160 60% 45%)',
];

export function ReportsPanel() {
  const rawLocale = useLocale();
  const locale = (rawLocale === 'bn' || rawLocale === 'en' ? rawLocale : 'bn') as 'bn' | 'en';
  const t = useT();
  const [data, setData] = useState<Reports | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await apiClient.get<Reports>('/api/admin/reports');
        if (!cancelled) setData(result);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof ApiClientError ? e.message : t('error'));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const exportCsv = () => {
    window.open('/api/admin/reports?format=csv', '_blank');
  };

  if (loading && !data) {
    return <div className="text-muted-foreground">{t('loading')}</div>;
  }
  if (error) {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
        {t('error')}: {error}
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
      <div className="flex items-center justify-end">
        <Button variant="outline" size="sm" onClick={exportCsv}>
          <Download className="mr-2 h-4 w-4" />
          {t('exportCsv')}
        </Button>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>{t('totalRaised')}</CardDescription>
            <CardTitle className="text-3xl">{formatBDT(data.totals.totalRaised, locale)}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            {data.totals.totalDonations} donations
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>{t('totalDonors')}</CardDescription>
            <CardTitle className="text-3xl">{data.totals.totalDonors}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>{t('successRate')}</CardDescription>
            <CardTitle className="text-3xl">{data.totals.successRate}%</CardTitle>
          </CardHeader>
        </Card>
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

// Local re-export to keep the component file self-contained.
import { useTranslations } from 'next-intl';
function useT() {
  return useTranslations('admin.reports');
}
