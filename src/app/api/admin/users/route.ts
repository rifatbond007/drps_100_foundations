/**
 * GET /api/admin/users — paginated user list with search & filters.
 *
 * Admin-only. Filters:
 *   ?q=<text>        — case-insensitive substring match on email OR name
 *   ?role=USER|ADMIN — exact role filter
 *   ?banned=true|false — banned status filter (default: all)
 *   ?page=<n>        — 1-based page (default 1, max 100)
 *   ?limit=<n>       — page size (default 20, max 100)
 *
 * Rate limit: RATE_LIMITS.ADMIN_ACTION (30 / 60s).
 */
import { z } from 'zod';
import { NextRequest } from 'next/server';
import { Prisma, UserRole } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth/session';
import { ok, fail } from '@/lib/api/helpers';
import { rateLimit, requireRateLimit, RATE_LIMITS } from '@/lib/rate-limit';

const querySchema = z.object({
  q: z.string().trim().max(100).optional(),
  role: z.enum(['USER', 'ADMIN']).optional(),
  banned: z
    .union([z.literal('true'), z.literal('false')])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === 'true')),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export async function GET(request: NextRequest) {
  try {
    const session = await requireAdmin();

    const rl = await rateLimit(
      `admin:users:list:${session.user.id}`,
      RATE_LIMITS.ADMIN_ACTION.max,
      RATE_LIMITS.ADMIN_ACTION.windowSeconds
    );
    requireRateLimit(rl);

    const { searchParams } = new URL(request.url);
    const parsed = querySchema.safeParse(Object.fromEntries(searchParams));
    if (!parsed.success) {
      return fail(
        new z.ZodError(parsed.error.issues.map((i) => ({ ...i, path: ['query', ...i.path] })))
      );
    }
    const { q, role, banned, page, limit } = parsed.data;

    const where: Prisma.UserWhereInput = {
      AND: [
        q
          ? {
              OR: [
                { email: { contains: q, mode: 'insensitive' } },
                { name: { contains: q, mode: 'insensitive' } },
              ],
            }
          : {},
        role ? { role: role as UserRole } : {},
        banned !== undefined ? { isBanned: banned } : {},
        // Exclude soft-deleted by default
        { deletedAt: null },
      ],
    };

    const [users, total, aggregates] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          email: true,
          name: true,
          avatarUrl: true,
          role: true,
          isBanned: true,
          bannedAt: true,
          bannedReason: true,
          languagePref: true,
          profileCompleted: true,
          createdAt: true,
          lastLoginAt: true,
          _count: { select: { donations: true } },
        },
      }),
      prisma.user.count({ where }),
      prisma.donation.groupBy({
        by: ['userId'],
        where: { status: 'SUCCESS', userId: { not: null } },
        _sum: { amount: true },
      }),
    ]);

    const totalsByUser = new Map(
      aggregates.map((row) => [row.userId as string, row._sum.amount ?? new Prisma.Decimal(0)])
    );

    return ok({
      users: users.map((u) => ({
        id: u.id,
        email: u.email,
        name: u.name,
        avatarUrl: u.avatarUrl,
        role: u.role,
        isBanned: u.isBanned,
        bannedAt: u.bannedAt,
        bannedReason: u.bannedReason,
        languagePref: u.languagePref,
        profileCompleted: u.profileCompleted,
        createdAt: u.createdAt,
        lastLoginAt: u.lastLoginAt,
        donationCount: u._count.donations,
        totalDonated: (totalsByUser.get(u.id) ?? new Prisma.Decimal(0)).toString(),
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    });
  } catch (error) {
    return fail(error);
  }
}
