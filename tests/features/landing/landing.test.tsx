import { describe, expect, it, vi, beforeAll } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import en from '../../../messages/en.json';
import { HeroStats } from '@/features/landing/hero-stats';
import { CauseCards } from '@/features/landing/causes';
import type { PublicStats } from '@/lib/stats';

beforeAll(() => {
  // Reduced motion: CountUp renders the final value immediately.
  window.matchMedia = vi
    .fn()
    .mockReturnValue({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() });
});

const stats: PublicStats = {
  totalRaised: '125000',
  donorCount: 42,
  donationCount: 97,
  byPurpose: { GENERAL_FUND: '0', EDUCATION: '0', MEDICAL: '25000', EMERGENCY: '0' },
  updatedAt: '2026-10-28T00:00:00Z',
};

const wrap = (ui: React.ReactNode) =>
  render(
    <NextIntlClientProvider locale="en" messages={en}>
      {ui}
    </NextIntlClientProvider>
  );

describe('HeroStats', () => {
  it('renders no figures when stats are unavailable', () => {
    wrap(<HeroStats stats={null} locale="en" />);
    expect(screen.queryByTestId('hero-total')).toBeNull();
  });

  it('renders the real total', () => {
    wrap(<HeroStats stats={stats} locale="en" />);
    expect(screen.getByTestId('hero-total').textContent).toContain('125,000');
  });
});

describe('CauseCards', () => {
  it('shows progress toward each goal', () => {
    wrap(<CauseCards stats={stats} locale="en" />);
    // MEDICAL: 25,000 of a 50,000 goal
    const medical = screen.getByRole('progressbar', { name: 'causeMedicalName' });
    expect(medical).toHaveAttribute('aria-valuenow', '50');
  });

  it('hides amounts and progress without stats', () => {
    wrap(<CauseCards stats={null} locale="en" />);
    expect(screen.queryAllByRole('progressbar')).toHaveLength(0);
  });
});
