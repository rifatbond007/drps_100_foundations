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
  // Manual bKash fields (added when we moved off the bKash auto-flow).
  // trxId is non-null as soon as the donor has submitted their bKash
  // TrxID via /api/donations/[id]/submit-trx. adminNote is populated
  // when an admin rejects the donation.
  trxId: string | null;
  trxSubmittedAt: string | null;
  adminNote: string | null;
}

export interface DonationHistoryResponse {
  donations: Donation[];
  total: number;
  page: number;
  limit: number;
}
