/**
 * Zod validation schemas — donations.
 * Per security-agent.md and payment-agent.md.
 */
import { z } from 'zod';

// BD phone number — matches 01XXXXXXXXX (11 digits, starts with 01).
// Used both for User.phone and Donation.senderPhone so a donor's saved
// phone is a hint when they submit TrxID.
const BD_PHONE_REGEX = /^01[3-9]\d{8}$/;

export const DONATION_PURPOSES = ['GENERAL_FUND', 'EDUCATION', 'MEDICAL', 'EMERGENCY'] as const;

export const createDonationSchema = z.object({
  amount: z
    .number()
    .min(10, 'Minimum ৳10')
    .max(100_000, 'Maximum ৳100,000')
    .refine((v) => Number.isFinite(v), 'Invalid amount')
    .refine((v) => Math.round(v * 100) === v * 100, 'Max 2 decimal places'),
  purpose: z.enum(DONATION_PURPOSES, {
    errorMap: () => ({ message: 'Invalid purpose' }),
  }),
  isAnonymous: z.boolean().default(false),
  idempotencyKey: z.string().uuid('Invalid idempotency key'),
});

export type CreateDonationInput = z.infer<typeof createDonationSchema>;

/**
 * Manual bKash submission — donor typed these in after sending money
 * to BKASH_RECEIVER_NUMBER. Stored on Donation.trxId / .senderPhone.
 */
export const submitTrxSchema = z.object({
  trxId: z
    .string()
    .trim()
    .min(6, 'TrxID too short')
    .max(40, 'TrxID too long')
    // bKash TrxIDs are alphanumeric. Be permissive about case so we
    // don't reject legitimate IDs that include lower-case.
    .regex(/^[A-Za-z0-9]+$/, 'TrxID must be alphanumeric'),
  senderPhone: z.string().trim().regex(BD_PHONE_REGEX, 'Phone must be 11 digits starting with 01'),
});

export type SubmitTrxInput = z.infer<typeof submitTrxSchema>;

/**
 * Admin review — optional note + approve/reject decision.
 */
export const adminReviewSchema = z.object({
  adminNote: z.string().trim().max(500).optional(),
});

export type AdminReviewInput = z.infer<typeof adminReviewSchema>;

export const donationHistoryQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(['PENDING', 'SUCCESS', 'FAILED', 'CANCELLED']).optional(),
  purpose: z.enum(DONATION_PURPOSES).optional(),
});

export type DonationHistoryQuery = z.infer<typeof donationHistoryQuerySchema>;
