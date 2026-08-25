/**
 * POST /api/users/complete-profile
 *
 * First-time user onboarding. Sets phone + language, flips profileCompleted=true.
 *
 * Body (JSON):
 *   { phone: string; languagePref: 'BN' | 'EN' }
 *
 * - Requires authenticated user (any role)
 * - Refuses if profile already completed (409)
 * - Validates phone as E.164-ish Bangladesh format (+8801XXXXXXXXX or 01XXXXXXXXX)
 * - Audit-logged
 */
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireActiveUser } from '@/lib/auth/session';
import { ok, fail } from '@/lib/api/helpers';
import { ConflictError, ValidationError } from '@/lib/errors';
import { logSecurityEvent } from '@/lib/audit';
import { rateLimit, requireRateLimit, RATE_LIMITS } from '@/lib/rate-limit';

const CompleteProfileSchema = z.object({
  phone: z
    .string()
    .trim()
    .min(11, 'Phone is too short')
    .max(20, 'Phone is too long')
    .regex(/^(\+?880|0)1[3-9]\d{8}$/, 'Invalid Bangladesh phone number'),
  languagePref: z.enum(['BN', 'EN']),
});

export async function POST(request: Request) {
  try {
    const session = await requireActiveUser();
    const rl = await rateLimit(
      `user:complete-profile:${session.user.id}`,
      RATE_LIMITS.COMPLETE_PROFILE.max,
      RATE_LIMITS.COMPLETE_PROFILE.windowSeconds
    );
    requireRateLimit(rl);
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      throw new ValidationError('Invalid JSON body');
    }

    const parsed = CompleteProfileSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError('Invalid profile data', {
        fieldErrors: parsed.error.flatten().fieldErrors,
      });
    }

    const existing = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { profileCompleted: true },
    });
    if (!existing) {
      throw new ValidationError('User no longer exists');
    }
    if (existing.profileCompleted) {
      throw new ConflictError('Profile already completed');
    }

    const updated = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        phone: parsed.data.phone,
        languagePref: parsed.data.languagePref,
        profileCompleted: true,
      },
      select: {
        id: true,
        phone: true,
        languagePref: true,
        profileCompleted: true,
      },
    });

    await logSecurityEvent({
      action: 'PROFILE_COMPLETED',
      userId: session.user.id,
      details: { languagePref: parsed.data.languagePref },
    });

    return ok(updated);
  } catch (error) {
    return fail(error);
  }
}
