import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const mocks = vi.hoisted(() => ({
  put: vi.fn(),
  patch: vi.fn(),
  setTheme: vi.fn(),
  push: vi.fn(),
}));
vi.mock('@/lib/api/client', () => ({ apiClient: { put: mocks.put, patch: mocks.patch } }));
vi.mock('next-themes', () => ({ useTheme: () => ({ theme: 'light', setTheme: mocks.setTheme }) }));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mocks.push, refresh: vi.fn() }),
  usePathname: () => '/bn/settings',
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({ invalidateQueries: vi.fn() }),
}));

import { PreferencesForm } from '@/features/profile/preferences-form';

beforeEach(() => {
  vi.clearAllMocks();
  mocks.put.mockResolvedValue({});
  mocks.patch.mockResolvedValue({});
});

describe('PreferencesForm', () => {
  it('saves the chosen theme to the account and applies it', async () => {
    render(<PreferencesForm languagePref="BN" />);
    await userEvent.click(screen.getByRole('radio', { name: /themeOptions.dark/ }));
    await userEvent.click(screen.getByRole('button', { name: 'save' }));
    expect(mocks.put).toHaveBeenCalledWith('/users/settings', { theme: 'dark' });
    expect(mocks.setTheme).toHaveBeenCalledWith('dark');
  });

  it('switches the URL locale when the language changes', async () => {
    render(<PreferencesForm languagePref="BN" />);
    await userEvent.click(screen.getByRole('radio', { name: /languageOptions.EN/ }));
    await userEvent.click(screen.getByRole('button', { name: 'save' }));
    expect(mocks.patch).toHaveBeenCalledWith('/users/profile', { languagePref: 'EN' });
    expect(mocks.push).toHaveBeenCalledWith('/en/settings');
  });

  it('has no notification toggles', () => {
    render(<PreferencesForm languagePref="BN" />);
    expect(screen.queryByRole('switch')).toBeNull();
  });
});
