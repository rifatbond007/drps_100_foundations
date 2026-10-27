/**
 * TanStack Query hook for the admin reports payload.
 *
 * Endpoint: GET /api/admin/reports
 * Returns:  totals + byPurpose + byMonth (chart-ready).
 *
 * Why these options differ from the default in Providers.tsx:
 *   - staleTime: 0               — never serve a stale snapshot. The
 *                                   admin needs to see new donations
 *                                   the moment they land.
 *   - refetchOnMount: 'always'   — re-fetch every time the component
 *                                   remounts (e.g. when navigating back
 *                                   to /admin/reports from another tab).
 *   - refetchOnWindowFocus: true — when the admin returns to the tab
 *                                   after creating a donation elsewhere,
 *                                   pull fresh numbers.
 *
 * The 60s staleTime / no-refetch defaults in Providers.tsx are fine for
 * user-facing pages (profile, donation history) but wrong for live admin
 * analytics.
 */
'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';

export interface AdminReports {
  totals: {
    totalRaised: string;
    totalDonations: number;
    totalDonors: number;
    totalUsers: number;
    successRate: number;
    todayTotal: string;
    todayCount: number;
  };
  byPurpose: { purpose: string; amount: string; count: number }[];
  byMonth: { month: string; amount: string; count: number }[];
}

export function useAdminReports() {
  return useQuery<AdminReports, Error>({
    queryKey: ['admin', 'reports'],
    queryFn: () => apiClient.get<AdminReports>('/admin/reports'),
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });
}

/**
 * Lighter-weight totals hook for the /admin/dashboard stat cards. Same
 * shape as `useAdminReports().data.totals` but exposed standalone so the
 * cards on /admin/dashboard can subscribe independently and avoid
 * rendering the chart components when only the totals changed.
 */
export function useAdminTotals() {
  return useQuery<AdminReports['totals'], Error>({
    queryKey: ['admin', 'reports', 'totals'],
    queryFn: async () => {
      const full = await apiClient.get<AdminReports>('/admin/reports');
      return full.totals;
    },
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });
}
