import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ApiClientError } from '@/lib/api/errors';

const mocks = vi.hoisted(() => ({
  post: vi.fn(),
  useAdminReports: vi.fn(),
  usePendingCount: vi.fn(),
}));
vi.mock('@/lib/api/client', () => ({ apiClient: { post: mocks.post } }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('@/hooks/use-admin', () => ({
  useAdminReports: mocks.useAdminReports,
  useAdminPendingCount: mocks.usePendingCount,
}));
vi.mock('@/features/admin/charts', () => ({ MonthlyChart: () => null, PurposeChart: () => null }));

import { ReviewDialog } from '@/features/admin/review-dialog';
import { AdminOverview } from '@/features/admin/admin-overview';

const donation = { id: 'd1', amount: '500', trxId: 'BK8X' };

beforeEach(() => vi.clearAllMocks());

describe('ReviewDialog', () => {
  it('requires a note before rejecting', async () => {
    render(
      <ReviewDialog
        mode="reject"
        donation={donation}
        open
        onOpenChange={() => {}}
        onDone={() => {}}
      />
    );
    const confirm = screen.getByRole('button', { name: 'reject' });
    expect(confirm).toBeDisabled();
    await userEvent.type(screen.getByLabelText('noteLabel'), 'TrxID not found');
    expect(confirm).toBeEnabled();
  });

  it('explains when another admin already reviewed it', async () => {
    const onDone = vi.fn();
    mocks.post.mockRejectedValueOnce(
      new ApiClientError('x', { status: 409, code: 'ALREADY_REVIEWED' })
    );
    render(
      <ReviewDialog
        mode="approve"
        donation={donation}
        open
        onOpenChange={() => {}}
        onDone={onDone}
      />
    );
    await userEvent.click(screen.getByRole('button', { name: 'approve' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('errors.codes.ALREADY_REVIEWED');
    expect(onDone).toHaveBeenCalled();
  });
});

describe('AdminOverview', () => {
  it('shows a retry instead of zeros when the numbers fail to load', () => {
    mocks.useAdminReports.mockReturnValue({ isError: true, isLoading: false, refetch: vi.fn() });
    mocks.usePendingCount.mockReturnValue({ isError: false, isLoading: false, data: 3 });
    render(<AdminOverview />);
    expect(screen.getByRole('button', { name: /retry/ })).toBeInTheDocument();
    expect(screen.queryByText('0')).toBeNull();
  });
});
