'use client';

import { useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useTheme } from 'next-themes';
import { apiClient } from '@/lib/api/client';

const THEMES = new Set(['light', 'dark', 'system']);

/**
 * Applies a signed-in user's saved theme once per page load. After that,
 * the theme toggle owns the value (and writes changes back).
 */
export function ThemeSync() {
  const { status } = useSession();
  const { setTheme } = useTheme();
  const synced = useRef(false);

  useEffect(() => {
    if (status !== 'authenticated' || synced.current) return;
    synced.current = true;
    apiClient
      .get<{ theme: string }>('/users/settings')
      .then(({ theme }) => {
        if (THEMES.has(theme)) setTheme(theme);
      })
      .catch(() => {
        // Keep the locally stored theme if settings can't be read.
      });
  }, [status, setTheme]);

  return null;
}
