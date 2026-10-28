'use client';

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatBDT, formatDate, type AppLocale } from '@/lib/format';

const axis = {
  stroke: 'hsl(var(--muted-foreground))',
  fontSize: 12,
  tickLine: false,
  axisLine: false,
};
const tooltipStyle = {
  background: 'hsl(var(--popover))',
  border: '1px solid hsl(var(--border))',
  borderRadius: 12,
  color: 'hsl(var(--popover-foreground))',
};

const monthLabel = (month: string, locale: AppLocale) =>
  formatDate(`${month}-15T00:00:00Z`, locale, { month: 'short' });

export function MonthlyChart({
  data,
  locale,
  height = 260,
}: {
  data: { month: string; amount: string }[];
  locale: AppLocale;
  height?: number;
}) {
  const rows = data.map((d) => ({ label: monthLabel(d.month, locale), amount: Number(d.amount) }));
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={rows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="raised" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="hsl(var(--border))" />
        <XAxis dataKey="label" {...axis} />
        <YAxis {...axis} width={64} tickFormatter={(v: number) => formatBDT(v, locale)} />
        <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => formatBDT(v, locale)} />
        <Area
          type="monotone"
          dataKey="amount"
          stroke="hsl(var(--primary))"
          strokeWidth={2.5}
          fill="url(#raised)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function PurposeChart({
  data,
  locale,
}: {
  data: { label: string; amount: number }[];
  locale: AppLocale;
}) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid horizontal={false} stroke="hsl(var(--border))" />
        <XAxis type="number" {...axis} tickFormatter={(v: number) => formatBDT(v, locale)} />
        <YAxis type="category" dataKey="label" {...axis} width={110} />
        <Tooltip
          contentStyle={tooltipStyle}
          formatter={(v: number) => formatBDT(v, locale)}
          cursor={{ fill: 'hsl(var(--muted))' }}
        />
        <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[0, 8, 8, 0]} barSize={22} />
      </BarChart>
    </ResponsiveContainer>
  );
}
