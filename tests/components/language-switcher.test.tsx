import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const mocks = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mocks.push }),
  usePathname: () => '/bn/about',
}));
vi.mock('next-intl', () => ({
  useLocale: () => 'bn',
  useTranslations: () => (key: string) => key,
}));

import { LanguageSwitcher } from '@/components/layout/language-switcher';

describe('LanguageSwitcher', () => {
  it('swaps the locale segment and keeps the query string', async () => {
    window.history.pushState({}, '', '/bn/about?x=1');
    render(<LanguageSwitcher />);
    await userEvent.click(screen.getByRole('button', { name: 'switchToEn' }));
    expect(mocks.push).toHaveBeenCalledWith('/en/about?x=1');
  });

  it('marks the current locale as pressed', () => {
    render(<LanguageSwitcher />);
    expect(screen.getByRole('button', { name: 'switchToBn' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
  });
});
