/**
 * Donation-related types (frontend).
 */

export type DonationStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED';
export type DonationPurpose = 'GENERAL_FUND' | 'EDUCATION' | 'MEDICAL' | 'EMERGENCY';

export interface Donation {
  id: string;
  amount: string; // Decimal serialized as string
  currency: string;
  purpose: DonationPurpose;
  status: DonationStatus;
  isAnonymous: boolean;
  bkashPaymentId: string | null;
  bkashTransactionId: string | null;
  createdAt: string;
  completedAt: string | null;
}

export interface DonationHistoryResponse {
  donations: Donation[];
  total: number;
  page: number;
  limit: number;
}
