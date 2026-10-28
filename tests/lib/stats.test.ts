import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  prisma: {
    donation: { aggregate: vi.fn(), groupBy: vi.fn() },
  },
  redis: { get: vi.fn(), set: vi.fn() },
}));
vi.mock('@/lib/prisma', () => ({ prisma: mocks.prisma }));
vi.mock('@/lib/redis', () => ({ redis: mocks.redis }));
vi.mock('@/lib/logger', () => ({ logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn() } }));

import { getPublicStats } from '@/lib/stats';

beforeEach(() => {
  vi.clearAllMocks();
  mocks.redis.get.mockResolvedValue(null);
  mocks.redis.set.mockResolvedValue('OK');
  mocks.prisma.donation.aggregate.mockResolvedValue({
    _sum: { amount: '1500' },
    _count: { _all: 3 },
  });
  mocks.prisma.donation.groupBy.mockImplementation(({ by }: { by: string[] }) =>
    Promise.resolve(
      by[0] === 'purpose'
        ? [
            { purpose: 'MEDICAL', _sum: { amount: '1000' } },
            { purpose: 'EDUCATION', _sum: { amount: '500' } },
          ]
        : [{ userId: 'u1' }, { userId: 'u2' }]
    )
  );
});

describe('getPublicStats', () => {
  it('aggregates SUCCESS donations with all four purposes present', async () => {
    const stats = await getPublicStats();
    expect(stats).toMatchObject({
      totalRaised: '1500',
      donationCount: 3,
      donorCount: 2,
      byPurpose: { GENERAL_FUND: '0', EDUCATION: '500', MEDICAL: '1000', EMERGENCY: '0' },
    });
    expect(mocks.prisma.donation.aggregate).toHaveBeenCalledWith(
      expect.objectContaining({ where: { status: 'SUCCESS' } })
    );
    expect(mocks.redis.set).toHaveBeenCalledWith('public:stats:v1', expect.any(String), 'EX', 60);
  });

  it('returns the cached value without querying the database', async () => {
    const cached = {
      totalRaised: '9',
      donorCount: 1,
      donationCount: 1,
      byPurpose: {},
      updatedAt: 'x',
    };
    mocks.redis.get.mockResolvedValueOnce(JSON.stringify(cached));
    expect(await getPublicStats()).toEqual(cached);
    expect(mocks.prisma.donation.aggregate).not.toHaveBeenCalled();
  });

  it('falls back to the database when Redis fails', async () => {
    mocks.redis.get.mockRejectedValueOnce(new Error('down'));
    mocks.redis.set.mockRejectedValueOnce(new Error('down'));
    expect((await getPublicStats()).totalRaised).toBe('1500');
  });
});
