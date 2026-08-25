/**
 * TanStack Query hook for the current user's profile.
 * Mirrors `useDonationHistory` (src/lib/hooks/use-donations.ts).
 *
 * Endpoint: GET /api/users/profile
 * Returns: id, email, name, avatarUrl, phone, role, languagePref,
 *          profileCompleted, createdAt, lastLoginAt, donationCount, totalDonated.
 */
'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';

export interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  phone: string | null;
  role: 'USER' | 'ADMIN';
  languagePref: 'BN' | 'EN';
  profileCompleted: boolean;
  createdAt: string;
  lastLoginAt: string | null;
  donationCount: number;
  totalDonated: string; // decimal-as-string from server (Prisma Decimal)
}

export function useProfile() {
  return useQuery<UserProfile, Error>({
    queryKey: ['profile'],
    queryFn: () => apiClient.get<UserProfile>('/users/profile'),
    staleTime: 60_000,
  });
}
