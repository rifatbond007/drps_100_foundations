/**
 * Zod schemas — profile completion (first-time onboarding).
 *
 * Distinct from `completeProfileSchema` in `user.ts`, which expects a `name`.
 * On Google OAuth first sign-in we already capture `name` from the Google
 * profile inside `lib/auth/next-auth.ts`, so this endpoint only needs the
 * fields the user has to provide themselves.
 */
import { z } from 'zod';
import { bangladeshPhoneSchema } from './user';

export const firstTimeProfileCompletionSchema = z.object({
  phone: bangladeshPhoneSchema,
  languagePref: z.enum(['BN', 'EN']),
});

export type FirstTimeProfileCompletionInput = z.infer<typeof firstTimeProfileCompletionSchema>;
