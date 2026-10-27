/**
 * TanStack Query hooks for the admin area.
 */
'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import type { DonationPurpose, DonationStatus } from '@/types/donation';

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
  byPurpose: { purpose: DonationPurpose; amount: string; count: number }[];
  /** Oldest first, `YYYY-MM` in Asia/Dhaka. */
  byMonth: { month: string; amount: string; count: number }[];
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface AdminDonation {
  id: string;
  amount: string;
  purpose: DonationPurpose;
  status: DonationStatus;
  trxId: string | null;
  senderPhone: string | null;
  trxSubmittedAt: string | null;
  reviewedAt: string | null;
  adminNote: string | null;
  createdAt: string;
  donor: { id: string; name: string | null; email: string; avatarUrl: string | null } | null;
}

export interface AdminUser {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  role: 'USER' | 'ADMIN';
  isBanned: boolean;
  bannedReason: string | null;
  createdAt: string;
  donationCount: number;
  totalDonated: string;
}

export function useAdminReports() {
  return useQuery<AdminReports, Error>({
    queryKey: ['admin', 'reports'],
    queryFn: () => apiClient.get<AdminReports>('/admin/reports'),
    staleTime: 0,
    refetchOnMount: 'always',
  });
}

/** Donations with a TrxID waiting for review. */
export function useAdminPendingCount() {
  return useQuery<number, Error>({
    queryKey: ['admin', 'donations', 'pending-count'],
    queryFn: async () =>
      (
        await apiClient.get<{ pagination: Pagination }>('/admin/donations', {
          params: { status: 'PENDING', limit: 1 },
        })
      ).pagination.total,
  });
}

export function useAdminDonations(status: DonationStatus, page: number) {
  return useQuery<{ donations: AdminDonation[]; pagination: Pagination }, Error>({
    queryKey: ['admin', 'donations', status, page],
    queryFn: () => apiClient.get('/admin/donations', { params: { status, page, limit: 20 } }),
    placeholderData: keepPreviousData,
  });
}

export function useAdminUsers(params: {
  q?: string;
  role?: 'ADMIN';
  banned?: boolean;
  page: number;
}) {
  const query: Record<string, string | number | boolean> = { page: params.page, limit: 20 };
  if (params.q) query.q = params.q;
  if (params.role) query.role = params.role;
  if (params.banned !== undefined) query.banned = params.banned;
  return useQuery<{ users: AdminUser[]; pagination: Pagination }, Error>({
    queryKey: ['admin', 'users', query],
    queryFn: () => apiClient.get('/admin/users', { params: query }),
    placeholderData: keepPreviousData,
  });
}
