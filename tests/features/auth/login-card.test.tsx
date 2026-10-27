import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const mocks = vi.hoisted(() => ({ signIn: vi.fn() }));
vi.mock('next-auth/react', () => ({ signIn: mocks.signIn }));

import { LoginCard } from '@/features/auth/login-card';
import { resolveLoginCallback } from '@/features/auth/login-callback';

beforeEach(() => vi.clearAllMocks());

describe('LoginCard', () => {
  it('does not start sign-in on mount', () => {
    render(<LoginCard callbackUrl="/en/donate" />);
    expect(mocks.signIn).not.toHaveBeenCalled();
  });

  it('signs in with Google and returns to the callback', async () => {
    render(<LoginCard callbackUrl="/en/donate" />);
    await userEvent.click(screen.getByRole('button', { name: 'loginWithGoogle' }));
    expect(mocks.signIn).toHaveBeenCalledWith('google', { callbackUrl: '/en/donate' });
  });

  it('shows NextAuth errors as an alert', () => {
    render(<LoginCard callbackUrl="/en" error="OAuthCallback" />);
    expect(screen.getByRole('alert')).toHaveTextContent('errors.oauthCallback');
  });
});

describe('resolveLoginCallback', () => {
  it('keeps a same-site path', () => {
    expect(resolveLoginCallback('/en/donate?x=1', 'en')).toBe('/en/donate?x=1');
  });

  it('ignores external URLs', () => {
    expect(resolveLoginCallback('https://evil.com', 'en')).toBe('/en/dashboard');
    expect(resolveLoginCallback('//evil.com', 'bn')).toBe('/bn/dashboard');
  });

  it('falls back when missing', () => {
    expect(resolveLoginCallback(undefined, 'bn')).toBe('/bn/dashboard');
  });
});
