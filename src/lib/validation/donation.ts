/**
 * Zod validation schemas — donations.
 * Per security-agent.md and payment-agent.md.
 */
import { z } from 'zod';

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

export const donationHistoryQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(['PENDING', 'SUCCESS', 'FAILED', 'CANCELLED']).optional(),
  purpose: z.enum(DONATION_PURPOSES).optional(),
});

export type DonationHistoryQuery = z.infer<typeof donationHistoryQuerySchema>;
