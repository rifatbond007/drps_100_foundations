'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useTheme } from 'next-themes';
import { useQueryClient } from '@tanstack/react-query';
import { Monitor, Moon, Sun } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { apiClient } from '@/lib/api/client';
import { OptionCards } from './option-cards';

type Theme = 'light' | 'dark' | 'system';
type Language = 'BN' | 'EN';

export function PreferencesForm({ languagePref }: { languagePref: Language }) {
  const t = useTranslations('settings');
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const { theme: currentTheme, setTheme } = useTheme();
  const [language, setLanguage] = useState<Language>(languagePref);
  const [theme, setThemeChoice] = useState<Theme>((currentTheme as Theme) ?? 'system');
  const [saving, setSaving] = useState(false);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await Promise.all([
        apiClient.put('/users/settings', { theme }),
        language !== languagePref
          ? apiClient.patch('/users/profile', { languagePref: language })
          : null,
      ]);
      setTheme(theme);
      toast.success(t('saved'));
      void queryClient.invalidateQueries({ queryKey: ['profile'] });
      if (language !== languagePref) {
        const next = language === 'EN' ? 'en' : 'bn';
        document.cookie = `NEXT_LOCALE=${next};path=/;max-age=31536000;samesite=lax`;
        router.push(pathname.replace(/^\/(bn|en)(?=\/|$)/, `/${next}`));
      }
    } catch {
      toast.error(t('saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('preferencesTitle')}</CardTitle>
        <CardDescription>{t('preferencesBody')}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={save} className="flex flex-col gap-6">
          <OptionCards
            name="language"
            legend={t('language')}
            value={language}
            onChange={setLanguage}
            options={(['BN', 'EN'] as const).map((v) => ({
              value: v,
              label: t(`languageOptions.${v}`),
            }))}
          />
          <OptionCards
            name="theme"
            legend={t('theme')}
            value={theme}
            onChange={setThemeChoice}
            options={[
              { value: 'light', label: t('themeOptions.light'), icon: Sun },
              { value: 'dark', label: t('themeOptions.dark'), icon: Moon },
              { value: 'system', label: t('themeOptions.system'), icon: Monitor },
            ]}
          />
          <Button type="submit" loading={saving} className="self-start">
            {t('save')}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
