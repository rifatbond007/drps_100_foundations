/**
 * Profile completion form (first-time user setup).
 * Submits phone + languagePref to POST /api/users/complete-profile, then
 * refreshes the session so JWT picks up profileCompleted=true.
 */
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { signIn } from 'next-auth/react';
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
  redirectTo?: string;
}

export function ProfileCompletionForm({
  defaultLanguage = 'BN',
  redirectTo = '/dashboard',
}: Props) {
  const t = useTranslations('auth.profileCompletion');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const [language, setLanguage] = useState<'BN' | 'EN'>(defaultLanguage);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const phone = (e.currentTarget.elements.namedItem('phone') as HTMLInputElement)?.value;
    try {
      const res = await fetch('/api/users/complete-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, languagePref: language }),
      });
      const json = (await res.json()) as
        | { success: true; data: unknown }
        | { success: false; message: string; details?: { fieldErrors?: Record<string, string[]> } };

      if (!json.success) {
        const fieldMsg = json.details?.fieldErrors?.phone?.[0];
        setError(fieldMsg ?? json.message ?? t('errors.submitFailed'));
        return;
      }

      // Refresh JWT so server-side guards see profileCompleted=true, then go.
      await signIn('google', { redirect: false });
      router.refresh();
      router.push(redirectTo);
    } catch {
      setError(t('errors.submitFailed'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="phone">{t('phoneLabel')}</Label>
        <Input
          id="phone"
          name="phone"
          type="tel"
          placeholder="+8801XXXXXXXXX"
          required
          disabled={submitting}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="language">{t('languageLabel')}</Label>
        <Select
          value={language}
          onValueChange={(v) => setLanguage(v as 'BN' | 'EN')}
          disabled={submitting}
        >
          <SelectTrigger id="language">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="BN">বাংলা</SelectItem>
            <SelectItem value="EN">English</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting ? tCommon('loading') : t('submit')}
      </Button>
    </form>
  );
}