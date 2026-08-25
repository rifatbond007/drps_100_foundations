/**
 * GET /api/users/profile — return current user profile.
 * PATCH /api/users/profile — update name, phone, avatarUrl, languagePref.
 *
 * Both require authentication. Users may only edit their own profile here;
 * admin operations on other users go through /api/admin/users/*.
 */
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/session';
import { ok, fail } from '@/lib/api/helpers';
import { NotFoundError, ValidationError } from '@/lib/errors';
import { logSecurityEvent } from '@/lib/audit';

const UpdateProfileSchema = z
  .object({
    name: z.string().trim().min(1).max(120).optional(),
    phone: z
      .string()
      .trim()
      .min(11)
      .max(20)
      .regex(/^(\+?880|0)1[3-9]\d{8}$/, 'Invalid Bangladesh phone number')
      .optional(),
    avatarUrl: z.string().url().max(500).optional().nullable(),
    languagePref: z.enum(['BN', 'EN']).optional(),
  })
  .strict();

export async function GET() {
  try {
    const session = await requireAuth();
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        phone: true,
        role: true,
        languagePref: true,
        profileCompleted: true,
        createdAt: true,
        lastLoginAt: true,
        _count: {
          select: { donations: true },
        },
      },
    });
    if (!user) throw new NotFoundError('User not found');

    // H-fix: \`donationCount\`/\`totalDonated\` aren't columns on User.
    // Compute them via aggregation so the route stays type-safe.
    const donationAgg = await prisma.donation.aggregate({
      where: { userId: session.user.id, status: 'SUCCESS' },
      _count: { _all: true },
      _sum: { amount: true },
    });

    return ok({
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      phone: user.phone,
      role: user.role,
      languagePref: user.languagePref,
      profileCompleted: user.profileCompleted,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
      donationCount: donationAgg._count._all,
      totalDonated: donationAgg._sum.amount?.toString() ?? '0',
    });
  } catch (error) {
    return fail(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await requireAuth();
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      throw new ValidationError('Invalid JSON body');
    }

    const parsed = UpdateProfileSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError('Invalid profile update', {
        fieldErrors: parsed.error.flatten().fieldErrors,
      });
    }

    const data = parsed.data;
    const updated = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.avatarUrl !== undefined && { avatarUrl: data.avatarUrl }),
        ...(data.languagePref !== undefined && { languagePref: data.languagePref }),
      },
      select: {
        id: true,
        name: true,
        phone: true,
        avatarUrl: true,
        languagePref: true,
        updatedAt: true,
      },
    });

    // Audit log — profile updates are security-relevant (phone, language).
    // Log only the keys that actually changed; never log the new values.
    const changedKeys = Object.keys(data);
    await logSecurityEvent({
      action: 'PROFILE_UPDATED',
      userId: session.user.id,
      details: { fields: changedKeys },
    });

    return ok(updated);
  } catch (error) {
    return fail(error);
  }
}
