import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ auth: vi.fn(), redirect: vi.fn() }));
vi.mock('@/lib/auth/next-auth', () => ({ auth: mocks.auth }));
vi.mock('next/navigation', () => ({
  redirect: (to: string) => {
    mocks.redirect(to);
    throw new Error('NEXT_REDIRECT');
  },
}));
vi.mock('next-intl/server', () => ({ setRequestLocale: vi.fn() }));

import LoginPage from '@/app/[locale]/(marketing)/login/page';

const render = (search: Record<string, string>) =>
  LoginPage({ params: Promise.resolve({ locale: 'en' }), searchParams: Promise.resolve(search) });

beforeEach(() => vi.clearAllMocks());

describe('login page', () => {
  it('sends a user with a valid session to their callback', async () => {
    mocks.auth.mockResolvedValueOnce({ user: { id: 'u1' } });
    await expect(render({ callbackUrl: '/en/donate' })).rejects.toThrow('NEXT_REDIRECT');
    expect(mocks.redirect).toHaveBeenCalledWith('/en/donate');
  });

  it('renders the login card when the session is revoked', async () => {
    mocks.auth.mockResolvedValueOnce({});
    await expect(render({ callbackUrl: '/en/donate' })).resolves.toBeTruthy();
    expect(mocks.redirect).not.toHaveBeenCalled();
  });
});
