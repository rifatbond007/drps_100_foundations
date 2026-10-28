'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { type Locale, locales } from '@/lib/i18n/config';
import { cn } from '@/lib/utils';

const shortLabels: Record<Locale, string> = { bn: 'বাং', en: 'EN' };

/** Two-segment pill: swaps the locale prefix, keeps the rest of the URL. */
export function LanguageSwitcher({ className }: { className?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const current = useLocale() as Locale;
  const t = useTranslations('a11y');

  const switchTo = (next: Locale) => {
    if (next === current) return;
    document.cookie = `NEXT_LOCALE=${next};path=/;max-age=31536000;samesite=lax`;
    router.push(`${pathname.replace(/^\/(bn|en)(?=\/|$)/, `/${next}`)}${window.location.search}`);
  };

  return (
    <div
      role="group"
      aria-label={t('language')}
      className={cn(
        'inline-flex h-9 items-center rounded-full bg-muted p-0.5 text-xs font-semibold',
        className
      )}
    >
      {locales.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => switchTo(l)}
          aria-pressed={l === current}
          aria-label={t(l === 'bn' ? 'switchToBn' : 'switchToEn')}
          className={cn(
            'h-8 min-w-9 rounded-full px-2 transition-colors',
            l === current
              ? 'bg-card text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {shortLabels[l]}
        </button>
      ))}
    </div>
  );
}
