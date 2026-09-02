/**
 * Admin landing stats — three single-line figures shown above all
 * admin pages: total users, total raised (lifetime, SUCCESS only),
 * today's donations.
 *
 * Layout: a 1fr row (3 equal columns on lg, stacked on mobile). Each
 * column is just a label + the number — no card chrome, no icon, no
 * subtitle. The numbers are large and tabular; the labels are tiny
 * uppercase eyebrows.
 */
import { formatBDT } from '@/lib/utils';

export interface AdminTotals {
  totalRaised: string;
  totalDonations: number;
  totalDonors: number;
  totalUsers: number;
  todayTotal: string;
  todayCount: number;
}

interface AdminStatsCardProps {
  totals: AdminTotals;
  locale: 'bn' | 'en';
}

export function AdminStatsCard({ totals, locale }: AdminStatsCardProps) {
  return (
    <dl className="grid grid-cols-1 gap-px overflow-hidden border border-border bg-border sm:grid-cols-3">
      <Cell label="Total users" value={totals.totalUsers.toLocaleString(locale)} />
      <Cell label="Total raised" value={formatBDT(totals.totalRaised, locale)} />
      <Cell label="Today" value={formatBDT(totals.todayTotal, locale)} />
    </dl>
  );
}

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-background px-4 py-3">
      <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1 text-2xl font-bold tabular-nums text-foreground">{value}</dd>
    </div>
  );
}
