/**
 * SignOutButton — locale-aware safe callbackUrl + signOut() invocation.
 */
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const { mockSignOut } = vi.hoisted(() => ({ mockSignOut: vi.fn() }));
vi.mock('next-auth/react', () => ({
  signOut: mockSignOut,
}));

import { SignOutButton } from '@/components/layout/SignOutButton';

beforeEach(() => {
  mockSignOut.mockReset();
  mockSignOut.mockResolvedValue({ ok: true, error: null, status: 200, url: '/' });
});

describe('SignOutButton', () => {
  function setPath(pathname: string) {
    // jsdom is happy to take this
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...window.location, pathname },
    });
  }

  it('renders the provided label', () => {
    setPath('/en');
    render(<SignOutButton label="Sign out" />);
    expect(screen.getByRole('button', { name: 'Sign out' })).toBeInTheDocument();
  });

  it('uses the current pathname as callbackUrl when safe', async () => {
    setPath('/en');
    const user = userEvent.setup();
    render(<SignOutButton label="Sign out" />);

    await user.click(screen.getByRole('button', { name: 'Sign out' }));

    expect(mockSignOut).toHaveBeenCalledWith({ callbackUrl: '/en' });
  });

  it('falls back to "/" when pathname is a protocol-relative URL', async () => {
    setPath('//evil.example.com');
    const user = userEvent.setup();
    render(<SignOutButton label="Sign out" />);

    await user.click(screen.getByRole('button', { name: 'Sign out' }));

    expect(mockSignOut).toHaveBeenCalledWith({ callbackUrl: '/' });
  });

  it('falls back to "/" when pathname is an external URL', async () => {
    setPath('https://evil.example.com');
    const user = userEvent.setup();
    render(<SignOutButton label="Sign out" />);

    await user.click(screen.getByRole('button', { name: 'Sign out' }));

    expect(mockSignOut).toHaveBeenCalledWith({ callbackUrl: '/' });
  });
});
