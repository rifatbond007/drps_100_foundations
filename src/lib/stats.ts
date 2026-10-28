/**
 * Public donation figures for the landing page.
 *
 * Only approved (SUCCESS) donations count. Donations from banned or
 * deleted users still count — the money was received. Cached in Redis
 * for 60s; Redis failures fall through to the database.
 */
import type { DonationPurpose } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { redis } from '@/lib/redis';
import { logger } from '@/lib/logger';

export interface PublicStats {
  totalRaised: string;
  donorCount: number;
  donationCount: number;
  byPurpose: Record<DonationPurpose, string>;
  updatedAt: string;
}

const CACHE_KEY = 'public:stats:v1';
const CACHE_TTL_SECONDS = 60;
const PURPOSES: DonationPurpose[] = ['GENERAL_FUND', 'EDUCATION', 'MEDICAL', 'EMERGENCY'];

async function computeStats(): Promise<PublicStats> {
  const where = { status: 'SUCCESS' as const };
  const [totals, perPurpose, donors] = await Promise.all([
    prisma.donation.aggregate({ where, _sum: { amount: true }, _count: { _all: true } }),
    prisma.donation.groupBy({ by: ['purpose'], where, _sum: { amount: true } }),
    prisma.donation.groupBy({ by: ['userId'], where: { ...where, userId: { not: null } } }),
  ]);

  const byPurpose = Object.fromEntries(PURPOSES.map((p) => [p, '0'])) as Record<
    DonationPurpose,
    string
  >;
  for (const row of perPurpose) {
    byPurpose[row.purpose] = row._sum.amount?.toString() ?? '0';
  }

  return {
    totalRaised: totals._sum.amount?.toString() ?? '0',
    donorCount: donors.length,
    donationCount: totals._count._all,
    byPurpose,
    updatedAt: new Date().toISOString(),
  };
}

export async function getPublicStats(): Promise<PublicStats> {
  try {
    const cached = await redis.get(CACHE_KEY);
    if (cached) return JSON.parse(cached) as PublicStats;
  } catch (error) {
    logger.warn(
      { err: error instanceof Error ? error.message : String(error) },
      'stats: cache read failed'
    );
  }

  const stats = await computeStats();

  await redis
    .set(CACHE_KEY, JSON.stringify(stats), 'EX', CACHE_TTL_SECONDS)
    .catch((error: unknown) =>
      logger.warn(
        { err: error instanceof Error ? error.message : String(error) },
        'stats: cache write failed'
      )
    );

  return stats;
}
