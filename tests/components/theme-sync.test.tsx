import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';

const mocks = vi.hoisted(() => ({
  useSession: vi.fn(),
  setTheme: vi.fn(),
  get: vi.fn(),
}));
vi.mock('next-auth/react', () => ({ useSession: mocks.useSession }));
vi.mock('next-themes', () => ({ useTheme: () => ({ setTheme: mocks.setTheme }) }));
vi.mock('@/lib/api/client', () => ({ apiClient: { get: mocks.get } }));

import { ThemeSync } from '@/components/layout/theme-sync';

beforeEach(() => vi.clearAllMocks());

describe('ThemeSync', () => {
  it('applies the saved theme once for a signed-in user', async () => {
    mocks.useSession.mockReturnValue({ status: 'authenticated' });
    mocks.get.mockResolvedValue({ theme: 'dark' });
    const { rerender } = render(<ThemeSync />);
    rerender(<ThemeSync />);
    await waitFor(() => expect(mocks.setTheme).toHaveBeenCalledWith('dark'));
    expect(mocks.get).toHaveBeenCalledTimes(1);
    expect(mocks.get).toHaveBeenCalledWith('/users/settings');
  });

  it('does not fetch settings when signed out', () => {
    mocks.useSession.mockReturnValue({ status: 'unauthenticated' });
    render(<ThemeSync />);
    expect(mocks.get).not.toHaveBeenCalled();
  });
});
