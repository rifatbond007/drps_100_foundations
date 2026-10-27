/**
 * Common Zod schemas.
 */
import { z } from 'zod';

export const cuidSchema = z.string().cuid();
export const uuidSchema = z.string().uuid();

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type Pagination = z.infer<typeof paginationSchema>;

/** Bangladesh mobile number for a user profile: 01XXXXXXXXX, 8801…, or +8801…. */
export const BD_PHONE_REGEX = /^(\+?880|0)1[3-9]\d{8}$/;

/** bKash sender number as typed in the bKash app: 01XXXXXXXXX. */
export const BKASH_PHONE_REGEX = /^01[3-9]\d{8}$/;
