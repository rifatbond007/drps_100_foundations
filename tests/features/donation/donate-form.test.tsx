import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ApiClientError } from '@/lib/api/errors';

const mocks = vi.hoisted(() => ({ post: vi.fn(), get: vi.fn(), push: vi.fn(), replace: vi.fn() }));
vi.mock('@/lib/api/client', () => ({ apiClient: { post: mocks.post, get: mocks.get } }));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mocks.push, replace: mocks.replace }),
  usePathname: () => '/en/donate',
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock('next-intl', () => ({
  useLocale: () => 'en',
  useTranslations: () => (key: string) => key,
}));

import { DonateForm } from '@/features/donation/donate-form';
import { TrxForm } from '@/features/donation/trx-form';

beforeEach(() => vi.clearAllMocks());

describe('DonateForm', () => {
  it('reuses the same idempotency key when retrying after a failure', async () => {
    mocks.post
      .mockRejectedValueOnce(new ApiClientError('boom', { status: 500, code: 'INTERNAL_ERROR' }))
      .mockResolvedValueOnce({ donationId: 'd1' });
    render(<DonateForm />);
    await userEvent.click(screen.getByRole('radio', { name: /500/ }));
    await userEvent.click(screen.getByRole('button', { name: /continue/ }));
    await userEvent.click(screen.getByRole('button', { name: /continue/ }));

    const keys = mocks.post.mock.calls.map(
      (c) => (c[1] as { idempotencyKey: string }).idempotencyKey
    );
    expect(keys).toHaveLength(2);
    expect(keys[0]).toBe(keys[1]);
    expect(mocks.push).toHaveBeenCalledWith('/en/donate/submit?id=d1');
  });
});

describe('TrxForm', () => {
  beforeEach(() => {
    mocks.get.mockResolvedValue({
      donation: { id: 'd1', amount: '500', purpose: 'MEDICAL', status: 'PENDING', trxId: null },
    });
  });

  async function fillAndSubmit() {
    await userEvent.type(await screen.findByLabelText('trxLabel'), 'BK8XQ2M1ZP');
    await userEvent.type(screen.getByLabelText('phoneLabel'), '01712345678');
    await userEvent.click(screen.getByRole('button', { name: /submit/ }));
  }

  it('shows the receiver number it was given', async () => {
    render(<TrxForm donationId="d1" receiverNumber="01999999999" />);
    expect(await screen.findByText('01999999999')).toBeInTheDocument();
  });

  it('shows the translated message for a reused TrxID', async () => {
    mocks.post.mockRejectedValueOnce(
      new ApiClientError('x', { status: 409, code: 'TRX_ALREADY_USED' })
    );
    render(<TrxForm donationId="d1" receiverNumber="01999999999" />);
    await fillAndSubmit();
    expect(await screen.findByRole('alert')).toHaveTextContent('errors.codes.TRX_ALREADY_USED');
  });

  it('goes to the pending page in the current locale', async () => {
    mocks.post.mockResolvedValueOnce({ donationId: 'd1' });
    render(<TrxForm donationId="d1" receiverNumber="01999999999" />);
    await fillAndSubmit();
    expect(mocks.push).toHaveBeenCalledWith('/en/donate/pending?id=d1');
  });
});
