/**
 * Profile completion form (first-time user setup).
 * SKELETON — fleshed out by auth-agent phase.
 */
'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Props {
  defaultLanguage?: 'BN' | 'EN';
}

export function ProfileCompletionForm({ defaultLanguage = 'BN' }: Props) {
  const t = useTranslations('auth.profileCompletion');
  const [language, setLanguage] = useState<'BN' | 'EN'>(defaultLanguage);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        // TODO: submit via /api/users/complete-profile
      }}
      className="space-y-4"
    >
      <div className="space-y-2">
        <Label htmlFor="phone">{t('phoneLabel')}</Label>
        <Input id="phone" type="tel" placeholder="+8801XXXXXXXXX" required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="language">{t('languageLabel')}</Label>
        <Select value={language} onValueChange={(v) => setLanguage(v as 'BN' | 'EN')}>
          <SelectTrigger id="language">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="BN">বাংলা</SelectItem>
            <SelectItem value="EN">English</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button type="submit" className="w-full">
        {t('submit')}
      </Button>
    </form>
  );
}
