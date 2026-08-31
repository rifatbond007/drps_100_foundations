/**
 * ProfileCompletionForm — happy path POST + sad path error rendering.
 *
 * Note: the global next-intl mock returns the translation key path as the
 * rendered text, so role-based queries target the key.
 */
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ApiClientError } from '@/lib/api/errors';

const { mockApiClientPost, mockRouter } = vi.hoisted(() => ({
  mockApiClientPost: vi.fn(),
  mockRouter: { refresh: vi.fn(), push: vi.fn(), replace: vi.fn() },
}));

vi.mock('@/lib/api/client', () => ({
  apiClient: { post: mockApiClientPost },
}));
vi.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
  usePathname: () => '/en/complete-profile',
  useSearchParams: () => new URLSearchParams(),
  redirect: vi.fn(),
}));

import { ProfileCompletionForm } from '@/components/auth/ProfileCompletionForm';

const SUBMIT_KEY = /^submit$/i;
const SAVING_KEY = /errors\.saving/i;

beforeEach(() => {
  mockApiClientPost.mockReset();
  mockRouter.refresh.mockReset();
});

describe('ProfileCompletionForm', () => {
  it('renders phone + language fields with the Bangla default', () => {
    render(<ProfileCompletionForm />);
    expect(screen.getByLabelText(/phoneLabel/i)).toBeInTheDocument();
    // The select trigger renders the current value label (বাংলা) verbatim
    expect(screen.getByRole('combobox')).toHaveTextContent(/বাংলা/);
    expect(screen.getByRole('button', { name: SUBMIT_KEY })).toBeInTheDocument();
  });

  it('uses the EN default when defaultLanguage="EN"', () => {
    render(<ProfileCompletionForm defaultLanguage="EN" />);
    expect(screen.getByRole('combobox')).toHaveTextContent(/English/);
  });

  it('submits a sanitized payload and calls router.refresh on success', async () => {
    mockApiClientPost.mockResolvedValueOnce({
      user: { id: 'u1', phone: '+8801712345678', languagePref: 'BN', profileCompleted: true },
    });
    const user = userEvent.setup();
    render(<ProfileCompletionForm />);

    await user.type(screen.getByLabelText(/phoneLabel/i), '+8801712345678');
    await user.click(screen.getByRole('button', { name: SUBMIT_KEY }));

    await waitFor(() => {
      expect(mockApiClientPost).toHaveBeenCalledWith('/users/complete-profile', {
        phone: '+8801712345678',
        languagePref: 'BN',
      });
    });
    expect(mockRouter.refresh).toHaveBeenCalled();
  });

  it('displays invalidPhone when API returns 400 with phone field error', async () => {
    mockApiClientPost.mockRejectedValueOnce(
      new ApiClientError('Invalid input', {
        status: 400,
        code: 'VALIDATION_ERROR',
        details: { fieldErrors: { phone: ['Must be +8801XXXXXXXXX'] } },
      })
    );
    const user = userEvent.setup();
    render(<ProfileCompletionForm />);

    await user.type(screen.getByLabelText(/phoneLabel/i), '+880000000000');
    await user.click(screen.getByRole('button', { name: SUBMIT_KEY }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/errors\.invalidPhone/);
    });
    expect(mockRouter.refresh).not.toHaveBeenCalled();
  });

  it('displays unauthorized when API returns 401', async () => {
    mockApiClientPost.mockRejectedValueOnce(
      new ApiClientError('Unauthorized', { status: 401, code: 'UNAUTHORIZED' })
    );
    const user = userEvent.setup();
    render(<ProfileCompletionForm />);

    await user.type(screen.getByLabelText(/phoneLabel/i), '+8801712345678');
    await user.click(screen.getByRole('button', { name: SUBMIT_KEY }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/errors\.unauthorized/);
    });
  });

  it('displays networkError when fetch throws or fails to parse', async () => {
    mockApiClientPost.mockRejectedValueOnce(
      new ApiClientError('Parse error', { status: 200, code: 'PARSE_ERROR' })
    );
    const user = userEvent.setup();
    render(<ProfileCompletionForm />);

    await user.type(screen.getByLabelText(/phoneLabel/i), '+8801712345678');
    await user.click(screen.getByRole('button', { name: SUBMIT_KEY }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/errors\.networkError/);
    });
  });

  it('shows the "saving" label and disables the button while submitting', async () => {
    let resolve!: (v: unknown) => void;
    mockApiClientPost.mockImplementationOnce(
      () =>
        new Promise((r) => {
          resolve = r;
        })
    );
    const user = userEvent.setup();
    render(<ProfileCompletionForm />);

    await user.type(screen.getByLabelText(/phoneLabel/i), '+8801712345678');
    const btn = screen.getByRole('button', { name: SUBMIT_KEY });
    await user.click(btn);

    expect(btn).toBeDisabled();
    expect(btn).toHaveTextContent(SAVING_KEY);

    // Resolve successfully so the try-branch finishes and router.refresh() runs.
    resolve({
      user: { id: 'u1', phone: '+8801712345678', languagePref: 'BN', profileCompleted: true },
    });
    await waitFor(
      () => {
        expect(btn).not.toBeDisabled();
      },
      { timeout: 2000 }
    );
    expect(mockRouter.refresh).toHaveBeenCalled();
  });
});
