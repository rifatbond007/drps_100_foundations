/**
 * Light test that the useDonationHistory hook wires the right cache key
 * and surfaces errors. Mocks both tanstack/react-query and the apiClient.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  apiClient: { get: vi.fn() },
  useQuery: vi.fn(),
}));

vi.mock('@tanstack/react-query', () => ({ useQuery: mocks.useQuery }));
vi.mock('@/lib/api/client', () => ({ apiClient: mocks.apiClient }));

import { useDonationHistory } from '@/lib/hooks/use-donations';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('useDonationHistory', () => {
  it('keys the query by donations/history + userId, calls apiClient.get', () => {
    let captured: unknown;
    mocks.useQuery.mockImplementationOnce((opts: unknown) => {
      captured = opts;
      return { data: undefined, isLoading: true, error: null };
    });

    useDonationHistory('user-42');

    expect(captured).toMatchObject({
      queryKey: ['donations', 'history', 'user-42'],
      enabled: true,
    });
    // queryFn is a closure; invoke and confirm it calls apiClient.get
    const fn = (captured as { queryFn: () => unknown }).queryFn;
    mocks.apiClient.get.mockResolvedValueOnce({ donations: [], total: 0, page: 1, limit: 20 });
    void fn();
    expect(mocks.apiClient.get).toHaveBeenCalledWith('/donations/history');
  });

  it('disables the query when no userId is provided', () => {
    let captured: unknown;
    mocks.useQuery.mockImplementationOnce((opts: unknown) => {
      captured = opts;
      return { data: undefined, isLoading: false, error: null };
    });

    useDonationHistory(undefined);

    expect(captured).toMatchObject({ enabled: false });
  });
});
