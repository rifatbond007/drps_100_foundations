/**
 * Admin landing stats — 3 cards shown above the main admin content:
 *   1. Total users (excludes soft-deleted)
 *   2. Total money raised (lifetime, SUCCESS status only)
 *   3. Today's total donations (server-local calendar day)
 *
 * Server component — fetches /api/admin/reports in the layout and passes
 * the totals down. This keeps the layout a pure server component and
 * avoids a client-side fetch waterfall.
 *
 * If the totals fetch fails for any reason, the cards render as "—" rather
 * than throwing — admin pages should never be blocked by a transient
 * reports failure.
 */
import { Users, Wallet, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
  /**
   * BCP-47 locale tag — passed through to formatBDT so Bengali vs English
   * digit shaping matches the rest of the page.
   */
  locale: 'bn' | 'en';
}

export function AdminStatsCard({ totals, locale }: AdminStatsCardProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardDescription>Total users</CardDescription>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <CardTitle className="text-3xl">{totals.totalUsers.toLocaleString(locale)}</CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">
            {totals.totalDonors.toLocaleString(locale)} have donated
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardDescription>Total raised</CardDescription>
          <Wallet className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <CardTitle className="text-3xl">{formatBDT(totals.totalRaised, locale)}</CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">
            {totals.totalDonations.toLocaleString(locale)} donations
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardDescription>Today&apos;s donations</CardDescription>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <CardTitle className="text-3xl">{formatBDT(totals.todayTotal, locale)}</CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">
            {totals.todayCount.toLocaleString(locale)} today
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
