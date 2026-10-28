import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const mocks = vi.hoisted(() => ({ signOut: vi.fn(), signIn: vi.fn(), locale: 'bn' }));
vi.mock('next-auth/react', () => ({ signOut: mocks.signOut, signIn: mocks.signIn }));
vi.mock('next-intl', () => ({
  useLocale: () => mocks.locale,
  useTranslations: () => (key: string) => key,
}));

import { SignOutButton } from '@/features/auth/sign-out-button';
import { SignInButton } from '@/features/auth/sign-in-button';

beforeEach(() => {
  vi.clearAllMocks();
  mocks.locale = 'bn';
});

describe('SignOutButton', () => {
  it('signs out to the current locale home', async () => {
    render(<SignOutButton />);
    await userEvent.click(screen.getByRole('button', { name: 'logout' }));
    expect(mocks.signOut).toHaveBeenCalledWith({ callbackUrl: '/bn' });
  });
});

describe('SignInButton', () => {
  it('defaults the callback to the locale dashboard', async () => {
    mocks.locale = 'en';
    render(<SignInButton />);
    await userEvent.click(screen.getByRole('button', { name: 'login' }));
    expect(mocks.signIn).toHaveBeenCalledWith('google', { callbackUrl: '/en/dashboard' });
  });

  it('passes an explicit callbackUrl through', async () => {
    render(<SignInButton callbackUrl="/bn/donate" />);
    await userEvent.click(screen.getByRole('button', { name: 'login' }));
    expect(mocks.signIn).toHaveBeenCalledWith('google', { callbackUrl: '/bn/donate' });
  });
});
