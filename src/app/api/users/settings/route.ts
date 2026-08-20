/**
 * GET /api/users/settings — read current user's settings (creates if missing).
 * PUT /api/users/settings — update notification prefs + theme.
 */
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/session';
import { ok, fail } from '@/lib/api/helpers';
import { ValidationError } from '@/lib/errors';

const SettingsSchema = z
  .object({
    emailNotifications: z.boolean().optional(),
    donationReceipts: z.boolean().optional(),
    theme: z.enum(['light', 'dark', 'system']).optional(),
  })
  .strict();

export async function GET() {
  try {
    const session = await requireAuth();
    // Upsert so first-time users always get a row to read.
    const settings = await prisma.userSettings.upsert({
      where: { userId: session.user.id },
      create: { userId: session.user.id },
      update: {},
    });
    return ok(settings);
  } catch (error) {
    return fail(error);
  }
}

export async function PUT(request: Request) {
  try {
    const session = await requireAuth();
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      throw new ValidationError('Invalid JSON body');
    }

    const parsed = SettingsSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError('Invalid settings', {
        fieldErrors: parsed.error.flatten().fieldErrors,
      });
    }

    const data = parsed.data;
    const settings = await prisma.userSettings.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        ...(data.emailNotifications !== undefined && {
          emailNotifications: data.emailNotifications,
        }),
        ...(data.donationReceipts !== undefined && {
          donationReceipts: data.donationReceipts,
        }),
        ...(data.theme !== undefined && { theme: data.theme }),
      },
      update: {
        ...(data.emailNotifications !== undefined && {
          emailNotifications: data.emailNotifications,
        }),
        ...(data.donationReceipts !== undefined && {
          donationReceipts: data.donationReceipts,
        }),
        ...(data.theme !== undefined && { theme: data.theme }),
      },
    });
    return ok(settings);
  } catch (error) {
    return fail(error);
  }
}