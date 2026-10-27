import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('next/navigation', () => ({
  usePathname: () => '/bn/history',
  useRouter: () => ({ push: vi.fn() }),
}));

import { AppNav } from '@/components/layout/app-sidebar';

const hrefs = () => screen.getAllByRole('link').map((a) => a.getAttribute('href'));

describe('AppNav', () => {
  it('hides admin links from regular users', () => {
    render(<AppNav role="USER" />);
    expect(hrefs()).toContain('/bn/donate');
    expect(hrefs()).not.toContain('/bn/admin/users');
  });

  it('shows admin links and hides donate for admins', () => {
    render(<AppNav role="ADMIN" />);
    expect(hrefs()).toContain('/bn/admin/users');
    expect(hrefs()).not.toContain('/bn/donate');
  });

  it('marks the active link', () => {
    render(<AppNav role="USER" />);
    expect(screen.getByRole('link', { current: 'page' })).toHaveAttribute('href', '/bn/history');
  });
});
