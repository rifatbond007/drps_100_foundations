/**
 * Profile completion form (first-time user setup).
 * Phone number + language preference, then POST to
 * `/api/users/complete-profile` and trigger a server re-render so the
 * profile-completion guard lifts and the user is bounced to /dashboard.
 */
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ApiClientError } from '@/lib/api/errors';
import { apiClient } from '@/lib/api/client';
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

interface ProfileCompletionResponse {
  user: {
    id: string;
    phone: string;
    languagePref: 'BN' | 'EN';
    profileCompleted: boolean;
  };
}

export function ProfileCompletionForm({ defaultLanguage = 'BN' }: Props) {
  const t = useTranslations('auth.profileCompletion');
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [language, setLanguage] = useState<'BN' | 'EN'>(defaultLanguage);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    setError(null);

    try {
      await apiClient.post<ProfileCompletionResponse>('/users/complete-profile', {
        phone,
        languagePref: language,
      });
      // server-side guards re-evaluate; layout-level middleware will route
      // the logged-in / completed-profile user away from /complete-profile
      router.refresh();
    } catch (err) {
      if (err instanceof ApiClientError) {
        if (err.status === 401) {
          setError(t('errors.unauthorized'));
        } else if (err.status === 0 || err.code === 'PARSE_ERROR' || err.code === 'HTTP_ERROR') {
          setError(t('errors.networkError'));
        } else if (err.status === 400) {
          // ValidationError carries the failing field in details; fall back
          // to invalidPhone if it's the phone field, else submitFailed.
          const fieldErrors = err.details as { fieldErrors?: Record<string, string[]> } | undefined;
          if (fieldErrors?.fieldErrors?.phone?.length) {
            setError(t('errors.invalidPhone'));
          } else {
            setError(t('errors.submitFailed'));
          }
        } else {
          setError(t('errors.submitFailed'));
        }
      } else {
        setError(t('errors.networkError'));
      }
    } finally {
      // Re-enable the button once the request settles — even on success,
      // router.refresh() triggers a server-rerender that may bring the user
      // back if profile completion wasn't accepted. Resetting here keeps
      // the form usable in that case.
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div className="space-y-2">
        <Label htmlFor="phone">{t('phoneLabel')}</Label>
        <Input
          id="phone"
          name="phone"
          type="tel"
          placeholder="+8801XXXXXXXXX"
          autoComplete="tel"
          inputMode="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
          aria-invalid={Boolean(error) || undefined}
        />
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

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? t('errors.saving') : t('submit')}
      </Button>

      {error && (
        <p role="alert" className="text-center text-sm text-destructive">
          {error}
        </p>
      )}
    </form>
  );
}
