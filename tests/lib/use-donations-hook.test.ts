/**
 * The donation history hooks: cache keys, query params, and paging.
 * Mocks tanstack/react-query and the apiClient.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  apiClient: { get: vi.fn() },
  useQuery: vi.fn(),
  useInfiniteQuery: vi.fn(),
}));

vi.mock('@tanstack/react-query', () => ({
  useQuery: mocks.useQuery,
  useInfiniteQuery: mocks.useInfiniteQuery,
}));
vi.mock('@/lib/api/client', () => ({ apiClient: mocks.apiClient }));

import { useDonationHistory, useDonationHistoryInfinite } from '@/hooks/use-donations';

type Opts = {
  queryKey: unknown[];
  queryFn: (ctx: { pageParam: number }) => unknown;
  getNextPageParam: (last: { page: number; limit: number; total: number }) => number | undefined;
};

beforeEach(() => vi.clearAllMocks());

describe('useDonationHistory', () => {
  it('requests a limited first page', () => {
    let captured: { queryKey: unknown[]; queryFn: () => unknown } | undefined;
    mocks.useQuery.mockImplementationOnce((opts) => {
      captured = opts;
      return {};
    });
    useDonationHistory({ limit: 5 });
    expect(captured?.queryKey).toEqual(['donations', 'history', { limit: 5 }]);
    void captured?.queryFn();
    expect(mocks.apiClient.get).toHaveBeenCalledWith('/donations/history', {
      params: { page: 1, limit: 5 },
    });
  });
});

describe('useDonationHistoryInfinite', () => {
  function capture(params: Parameters<typeof useDonationHistoryInfinite>[0]): Opts {
    let captured: Opts | undefined;
    mocks.useInfiniteQuery.mockImplementationOnce((opts: Opts) => {
      captured = opts;
      return {};
    });
    useDonationHistoryInfinite(params);
    return captured!;
  }

  it('requests the given page with the status filter', () => {
    const opts = capture({ status: 'PENDING' });
    void opts.queryFn({ pageParam: 2 });
    expect(mocks.apiClient.get).toHaveBeenCalledWith('/donations/history', {
      params: { page: 2, limit: 20, status: 'PENDING' },
    });
  });

  it('stops paging after the last page', () => {
    const opts = capture({});
    expect(opts.getNextPageParam({ page: 1, limit: 20, total: 45 })).toBe(2);
    expect(opts.getNextPageParam({ page: 3, limit: 20, total: 45 })).toBeUndefined();
  });
});
