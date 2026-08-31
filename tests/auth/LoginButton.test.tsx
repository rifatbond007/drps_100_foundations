/**
 * LoginButton — exercises the Google OAuth sign-in trigger.
 *
 * Note on i18n: the global next-intl mock in `vitest.setup.ts` returns the
 * translation *key path* (e.g. "auth.loginWithGoogle") as the rendered text,
 * so role-based queries target the key instead of the English/Bangla value.
 */
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const { mockSignIn } = vi.hoisted(() => ({ mockSignIn: vi.fn() }));
vi.mock('next-auth/react', () => ({
  signIn: mockSignIn,
}));

import { LoginButton } from '@/components/auth/LoginButton';

const SIGN_IN_BTN = /loginWithGoogle/i;

beforeEach(() => {
  mockSignIn.mockReset();
  // Default: a happy-path response
  mockSignIn.mockResolvedValue({ ok: true, error: null, status: 200, url: '/dashboard' });
});

describe('LoginButton', () => {
  it('renders the default button (key path in tests)', () => {
    render(<LoginButton />);
    expect(screen.getByRole('button', { name: SIGN_IN_BTN })).toBeInTheDocument();
  });

  it('renders an overridden label when provided', () => {
    render(<LoginButton label="Continue with Google" />);
    expect(screen.getByRole('button', { name: /continue with google/i })).toBeInTheDocument();
  });

  it('calls signIn("google", …) with the sanitized callbackUrl on click', async () => {
    const user = userEvent.setup();
    render(<LoginButton callbackUrl="/en/donate" />);

    await user.click(screen.getByRole('button', { name: SIGN_IN_BTN }));

    expect(mockSignIn).toHaveBeenCalledWith(
      'google',
      expect.objectContaining({ callbackUrl: '/en/donate', redirect: true })
    );
  });

  it('falls back to "/" when callbackUrl is unsafe (safeCallbackUrl default)', async () => {
    const user = userEvent.setup();
    render(<LoginButton callbackUrl="//evil.example.com" />);

    await user.click(screen.getByRole('button', { name: SIGN_IN_BTN }));

    // safeCallbackUrl strips protocol-relative URLs and falls back to "/".
    // The component does not pass a custom fallback, so we get "/".
    expect(mockSignIn).toHaveBeenCalledWith(
      'google',
      expect.objectContaining({ callbackUrl: '/' })
    );
  });

  it('disables the button while the request is in flight', async () => {
    // Resolving with { ok: false } triggers the existing error path,
    // which is what re-enables the button in this component (a successful
    // signIn({ redirect: true }) navigates away in production).
    let resolveSignIn!: (v: unknown) => void;
    mockSignIn.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveSignIn = resolve;
        })
    );
    const user = userEvent.setup();
    render(<LoginButton />);

    const btn = screen.getByRole('button', { name: SIGN_IN_BTN });
    await user.click(btn);

    expect(btn).toBeDisabled();
    expect(btn).toHaveAttribute('aria-busy', 'true');

    resolveSignIn({ ok: false, error: 'OAuthSignin', status: 200, url: null });
    await waitFor(() => {
      expect(btn).not.toBeDisabled();
    });
  });

  it('shows the Default error when signIn rejects', async () => {
    mockSignIn.mockRejectedValueOnce(new Error('network'));
    const user = userEvent.setup();
    render(<LoginButton />);

    await user.click(screen.getByRole('button', { name: SIGN_IN_BTN }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/errors\.Default/);
    });
  });

  it('shows the Default error when signIn returns ok=false', async () => {
    mockSignIn.mockResolvedValueOnce({ ok: false, error: 'OAuthSignin', status: 200, url: null });
    const user = userEvent.setup();
    render(<LoginButton />);

    await user.click(screen.getByRole('button', { name: SIGN_IN_BTN }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/errors\.Default/);
    });
  });
});
