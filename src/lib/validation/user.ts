/**
 * Zod validation schemas — users.
 */
import { z } from 'zod';
import { BD_PHONE_REGEX } from './common';

export const bangladeshPhoneSchema = z
  .string()
  .trim()
  .regex(BD_PHONE_REGEX, 'Invalid Bangladesh phone number');

export const completeProfileSchema = z.object({
  name: z.string().trim().min(1, 'Name required').max(100, 'Name too long'),
  phone: bangladeshPhoneSchema,
  languagePref: z.enum(['BN', 'EN']),
});

export type CompleteProfileInput = z.infer<typeof completeProfileSchema>;

export const updateProfileSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  phone: bangladeshPhoneSchema.optional(),
  languagePref: z.enum(['BN', 'EN']).optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export const updateSettingsSchema = z.object({
  emailNotifications: z.boolean().optional(),
  donationReceipts: z.boolean().optional(),
  theme: z.enum(['light', 'dark', 'system']).optional(),
});

export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;

export const banUserSchema = z.object({
  userId: z.string().cuid(),
  reason: z.string().trim().min(10, 'Reason must be at least 10 characters').max(500),
});

export type BanUserInput = z.infer<typeof banUserSchema>;
