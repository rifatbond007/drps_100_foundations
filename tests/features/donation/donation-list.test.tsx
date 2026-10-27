import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DonationList } from '@/features/donation/donation-list';
import type { Donation } from '@/types/donation';

const base: Donation = {
  id: 'd1',
  amount: '500',
  currency: 'BDT',
  purpose: 'MEDICAL',
  status: 'PENDING',
  isAnonymous: false,
  bkashPaymentId: 'd1',
  bkashTransactionId: null,
  createdAt: '2026-10-01T10:00:00Z',
  completedAt: null,
  trxId: null,
  trxSubmittedAt: null,
  adminNote: null,
};

describe('DonationList', () => {
  it('links a pending donation without a TrxID to the submit page', () => {
    render(<DonationList items={[base]} locale="bn" />);
    expect(screen.getByRole('link', { name: /submitTrx/ })).toHaveAttribute(
      'href',
      '/bn/donate/submit?id=d1'
    );
  });

  it('shows the admin note on a rejected donation', () => {
    render(
      <DonationList
        items={[{ ...base, status: 'FAILED', trxId: 'X1', adminNote: 'Amount mismatch' }]}
        locale="en"
      />
    );
    expect(screen.getByText(/Amount mismatch/)).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /submitTrx/ })).toBeNull();
  });
});
