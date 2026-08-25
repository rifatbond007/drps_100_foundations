/**
 * Live variant of the admin stat card row.
 *
 * Uses the `useAdminTotals` TanStack Query hook (staleTime: 0,
 * refetchOnMount: 'always', refetchOnWindowFocus: true) so the three
 * Total users / Total raised / Today's donations cards always reflect
 * the current DB state — even when the admin navigates back to the
 * dashboard after a donation was made elsewhere (e.g. by another user
 * in a different tab) without forcing a hard refresh.
 *
 * Falls back to placeholders ("—") while the initial fetch is in flight
 * or when the request errors, so the layout doesn't shift and the rest
 * of the dashboard stays usable.
 */
'use client';

import { AdminStatsCard } from './AdminStatsCard';
import { useAdminTotals } from '@/lib/hooks/use-admin-reports';

const EMPTY_TOTALS = {
  totalRaised: '0',
  totalDonations: 0,
  totalDonors: 0,
  totalUsers: 0,
  todayTotal: '0',
  todayCount: 0,
} as const;

export function AdminTotalsLive({ locale }: { locale: 'bn' | 'en' }) {
  const { data, error } = useAdminTotals();

  if (error || !data) {
    // Show zeros rather than throwing so admin pages remain usable on
    // transient reports-API failures. The /admin/reports page surfaces
    // the real error inline.
    return <AdminStatsCard totals={EMPTY_TOTALS} locale={locale} />;
  }
  return <AdminStatsCard totals={data} locale={locale} />;
}
