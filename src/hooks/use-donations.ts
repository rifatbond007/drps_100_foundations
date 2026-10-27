/**
 * TanStack Query hooks for donations.
 * SKELETON — fleshed out by payment-agent phase.
 */
'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import type { DonationHistoryResponse } from '@/types/donation';

export function useDonationHistory(userId?: string) {
  return useQuery<DonationHistoryResponse, Error>({
    queryKey: ['donations', 'history', userId],
    queryFn: () => apiClient.get<DonationHistoryResponse>('/donations/history'),
    enabled: !!userId,
  });
}
