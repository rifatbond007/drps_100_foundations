/**
 * Language switcher — client component.
 *
 * Segmented pill control with both locales visible. Replaces the URL
 * prefix from current locale to target locale. No dropdown: at two
 * locales the segmented control is faster (one click, no menu) and
 * visually quieter in the navbar than a Radix Select.
 */
'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useLocale } from 'next-intl';
import { type Locale, locales } from '@/lib/i18n/config';

/**
 * Compact labels for the segmented control. Two-character codes read
 * cleanly in a 32 px tall pill without forcing the navbar to wrap on
 * narrow viewports. Full names live in `localeLabels` (used elsewhere).
 */
const shortLabels: Record<Locale, string> = {
  bn: 'বাং',
  en: 'EN',
};

export function LanguageSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const currentLocale = useLocale() as Locale;

  const handleChange = (newLocale: Locale) => {
    if (newLocale === currentLocale) return;
    // Replace /{currentLocale} prefix with /{newLocale}
    const newPath = pathname.replace(/^\/(bn|en)/, `/${newLocale}`);
    router.push(newPath);
    document.cookie = `NEXT_LOCALE=${newLocale};path=/;max-age=31536000`;
  };

  return (
    /*
      Single rounded-full container with `divide-x` so the segments share
      a border without doubling up. `bg-muted/60` keeps it neutral on
      the navbar's translucent white background; the active segment
      flips to `bg-background` + `text-foreground` + shadow for the
      pressed-in look. Each button is 36 px square (h-9 w-9) — matches
      the navbar's icon-button rhythm next to UserMenu.
    */
    <div
      role="group"
      aria-label="Language"
      className="inline-flex h-9 items-center overflow-hidden rounded-full border bg-muted/60 text-xs font-semibold"
    >
      {locales.map((l) => {
        const isActive = l === currentLocale;
        return (
          <button
            key={l}
            type="button"
            onClick={() => handleChange(l)}
            aria-pressed={isActive}
            aria-label={`Switch to ${l === 'bn' ? 'Bangla' : 'English'}`}
            className={
              isActive
                ? 'flex h-9 w-9 items-center justify-center bg-background text-foreground shadow-sm transition-colors'
                : 'flex h-9 w-9 items-center justify-center text-muted-foreground transition-colors hover:bg-background/60 hover:text-foreground'
            }
          >
            {shortLabels[l]}
          </button>
        );
      })}
    </div>
  );
}
