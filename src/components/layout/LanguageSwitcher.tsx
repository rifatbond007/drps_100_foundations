/**
 * Language switcher — client component.
 * Replaces the URL prefix from current locale to target locale.
 */
'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useLocale } from 'next-intl';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { locales, localeLabels, type Locale } from '@/lib/i18n/config';

export function LanguageSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const currentLocale = useLocale() as Locale;

  const handleChange = (newLocale: string) => {
    if (newLocale === currentLocale) return;
    // Replace /{currentLocale} prefix with /{newLocale}
    const newPath = pathname.replace(/^\/(bn|en)/, `/${newLocale}`);
    router.push(newPath);
    document.cookie = `NEXT_LOCALE=${newLocale};path=/;max-age=31536000`;
  };

  return (
    <Select value={currentLocale} onValueChange={handleChange}>
      <SelectTrigger className="w-[100px] sm:w-[120px]" aria-label="Language">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {locales.map((l) => (
          <SelectItem key={l} value={l}>
            {localeLabels[l]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
