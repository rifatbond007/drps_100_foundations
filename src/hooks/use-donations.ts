/**
 * TanStack Query hooks for the signed-in user's donation history.
 */
'use client';

import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import type { DonationHistoryResponse, DonationStatus } from '@/types/donation';

interface HistoryParams {
  status?: DonationStatus;
  limit?: number;
}

const fetchPage = (page: number, { status, limit = 20 }: HistoryParams) =>
  apiClient.get<DonationHistoryResponse>('/donations/history', {
    params: { page, limit, ...(status ? { status } : {}) },
  });

/** First page only — e.g. the dashboard's recent donations. */
export function useDonationHistory(params: HistoryParams = {}) {
  return useQuery<DonationHistoryResponse, Error>({
    queryKey: ['donations', 'history', params],
    queryFn: () => fetchPage(1, params),
  });
}

/** Paged history with "load more". */
export function useDonationHistoryInfinite(params: HistoryParams) {
  return useInfiniteQuery<DonationHistoryResponse, Error>({
    queryKey: ['donations', 'history', 'infinite', params],
    initialPageParam: 1,
    queryFn: ({ pageParam }) => fetchPage(pageParam as number, params),
    getNextPageParam: (last) => (last.page * last.limit < last.total ? last.page + 1 : undefined),
  });
}
