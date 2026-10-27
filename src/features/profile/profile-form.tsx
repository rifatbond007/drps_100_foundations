'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import type { UserProfile } from '@/hooks/use-profile';
import { apiClient } from '@/lib/api/client';
import { updateProfileSchema } from '@/lib/validation/user';

export function ProfileForm({ profile }: { profile: UserProfile }) {
  const t = useTranslations('settings');
  const queryClient = useQueryClient();
  const [name, setName] = useState(profile.name ?? '');
  const [phone, setPhone] = useState(profile.phone ?? '');
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({});
  const [saving, setSaving] = useState(false);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    // An empty phone means "leave unchanged"; the API has no "clear" yet.
    const input = { name: name.trim(), ...(phone.trim() ? { phone: phone.trim() } : {}) };
    const parsed = updateProfileSchema.safeParse(input);
    if (!parsed.success) {
      const issues = parsed.error.flatten().fieldErrors;
      setErrors({
        name: issues.name ? t('invalidName') : undefined,
        phone: issues.phone ? t('invalidPhone') : undefined,
      });
      return;
    }
    setErrors({});
    setSaving(true);
    try {
      await apiClient.patch('/users/profile', parsed.data);
      toast.success(t('saved'));
      void queryClient.invalidateQueries({ queryKey: ['profile'] });
    } catch {
      toast.error(t('saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('profileTitle')}</CardTitle>
        <CardDescription>{t('profileBody')}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-6 flex items-center gap-4">
          <Avatar
            name={profile.name ?? profile.email}
            src={profile.avatarUrl}
            className="size-14 text-lg"
          />
          <div className="min-w-0">
            <p className="truncate font-semibold">{profile.name}</p>
            <p className="truncate text-sm text-muted-foreground">{profile.email}</p>
          </div>
        </div>
        <form onSubmit={save} noValidate className="grid gap-5 sm:grid-cols-2">
          <Field label={t('name')} htmlFor="name" error={errors.name}>
            <Input
              id="name"
              value={name}
              autoComplete="name"
              placeholder={t('namePlaceholder')}
              onChange={(e) => setName(e.target.value)}
            />
          </Field>
          <Field label={t('phone')} htmlFor="phone" error={errors.phone} hint={t('phoneHint')}>
            <Input
              id="phone"
              value={phone}
              inputMode="tel"
              autoComplete="tel"
              placeholder={t('phonePlaceholder')}
              onChange={(e) => setPhone(e.target.value)}
            />
          </Field>
          <Field
            label={t('email')}
            htmlFor="email"
            hint={t('emailReadOnly')}
            className="sm:col-span-2"
          >
            <Input id="email" value={profile.email} readOnly disabled />
          </Field>
          <Button
            type="submit"
            loading={saving}
            className="self-start sm:col-span-2 sm:justify-self-start"
          >
            {t('save')}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
