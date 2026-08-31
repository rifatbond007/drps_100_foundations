/**
 * Authenticated settings page.
 *
 * Uses react-hook-form + zod resolver with two parallel schemas:
 *   - profile  → PATCH /api/users/profile  (name, phone, languagePref)
 *   - settings → PUT  /api/users/settings  (notifications, theme)
 *
 * Both submits run in parallel when the user clicks Save. Email is
 * read-only (NextAuth providers don't allow changing email here).
 */
'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar } from '@/components/ui/avatar';
import { useAuth } from '@/lib/hooks/use-auth';
import { useProfile, type UserProfile } from '@/lib/hooks/use-profile';
import { apiClient } from '@/lib/api/client';
import { ApiClientError } from '@/lib/api/errors';
import { cn } from '@/lib/utils';
import {
  updateProfileSchema,
  updateSettingsSchema,
  type UpdateProfileInput,
  type UpdateSettingsInput,
} from '@/lib/validation/user';

type ProfileForm = UpdateProfileInput;
type SettingsForm = UpdateSettingsInput;

interface UserSettings {
  emailNotifications: boolean;
  donationReceipts: boolean;
  theme: 'light' | 'dark' | 'system';
}

export default function SettingsPage() {
  const t = useTranslations('settings');
  const tCommon = useTranslations('common');
  const { user } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();

  // Profile form (PATCH /api/users/profile)
  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: { name: '', phone: '', languagePref: 'BN' },
    mode: 'onBlur',
  });

  // Settings form (PUT /api/users/settings)
  const settingsForm = useForm<SettingsForm>({
    resolver: zodResolver(updateSettingsSchema),
    defaultValues: {
      emailNotifications: true,
      donationReceipts: true,
      theme: 'system',
    },
    mode: 'onBlur',
  });

  const [settingsLoading, setSettingsLoading] = useState(true);
  const [settingsLoadError, setSettingsLoadError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);

  // Hydrate profile form when profile loads
  useEffect(() => {
    if (profile) {
      profileForm.reset({
        name: profile.name ?? '',
        phone: profile.phone ?? '',
        languagePref: profile.languagePref,
      });
    }
    // profileForm.reset is stable across renders; only re-hydrate when profile id changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id]);

  // Hydrate settings form when /api/users/settings responds
  useEffect(() => {
    let cancelled = false;
    setSettingsLoading(true);
    apiClient
      .get<UserSettings>('/users/settings')
      .then((s) => {
        if (cancelled) return;
        settingsForm.reset({
          emailNotifications: s.emailNotifications,
          donationReceipts: s.donationReceipts,
          theme: s.theme,
        });
        setSettingsLoading(false);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setSettingsLoading(false);
        setSettingsLoadError(err instanceof Error ? err.message : String(err));
      });
    return () => {
      cancelled = true;
    };
    // settingsForm.reset is stable across renders; we only want to fetch once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!user) return null;

  const onSave = async () => {
    setSaveState('saving');
    setSaveError(null);

    const profileValid = await profileForm.trigger();
    const settingsValid = await settingsForm.trigger();
    if (!profileValid || !settingsValid) {
      setSaveState('error');
      setSaveError(t('validationFailed'));
      return;
    }

    const profileData = profileForm.getValues();
    const settingsData = settingsForm.getValues();

    try {
      const tasks: Promise<unknown>[] = [];
      // Only PATCH profile if anything actually changed.
      if (
        profileData.name !== (profile?.name ?? '') ||
        (profileData.phone || '') !== (profile?.phone ?? '') ||
        profileData.languagePref !== profile?.languagePref
      ) {
        tasks.push(
          apiClient.patch<UserProfile>('/users/profile', {
            ...(profileData.name !== undefined && { name: profileData.name }),
            ...(profileData.phone !== undefined && {
              phone: profileData.phone || undefined,
            }),
            ...(profileData.languagePref !== undefined && {
              languagePref: profileData.languagePref,
            }),
          })
        );
      }
      // Settings always sent — they have defaults and the schema is partial.
      tasks.push(apiClient.put<UserSettings>('/users/settings', settingsData));

      await Promise.all(tasks);
      setSaveState('saved');
      // Auto-hide the "saved" badge after a few seconds.
      setTimeout(() => {
        setSaveState((prev) => (prev === 'saved' ? 'idle' : prev));
      }, 3000);
    } catch (err) {
      setSaveState('error');
      setSaveError(
        err instanceof ApiClientError
          ? err.message
          : err instanceof Error
            ? err.message
            : String(err)
      );
    }
  };

  const isSaving = saveState === 'saving';
  const profileName = profile?.name ?? user.name ?? null;
  const profileEmail = profile?.email ?? user.email ?? null;

  return (
    <div className="space-y-3">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
        <p className="text-sm text-muted-foreground">{t('subtitle')}</p>
      </div>

      {/* Identity card (read-only) */}
      <Card>
        <CardContent className="flex items-center gap-4 py-3">
          <Avatar
            src={profile?.avatarUrl ?? user.image ?? null}
            name={profileName}
            email={profileEmail}
            size="md"
          />
          <div>
            <div className="text-base font-semibold">{profileName ?? '—'}</div>
            <div className="text-xs text-muted-foreground">{profileEmail ?? '—'}</div>
          </div>
        </CardContent>
      </Card>

      {/* Profile form */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">{t('profile')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {profileLoading ? (
            <div className="text-sm text-muted-foreground">{tCommon('loading')}</div>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="settings-name">{t('name')}</Label>
                <Input
                  id="settings-name"
                  placeholder={t('namePlaceholder')}
                  {...profileForm.register('name')}
                />
                {profileForm.formState.errors.name && (
                  <p className="text-xs text-destructive">
                    {profileForm.formState.errors.name.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="settings-email">{t('email')}</Label>
                <Input id="settings-email" type="email" disabled value={profileEmail ?? ''} />
                <p className="text-xs text-muted-foreground">{t('emailReadOnly')}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="settings-phone">{t('phone')}</Label>
                <Input
                  id="settings-phone"
                  placeholder={t('phonePlaceholder')}
                  {...profileForm.register('phone')}
                />
                {profileForm.formState.errors.phone && (
                  <p className="text-xs text-destructive">
                    {profileForm.formState.errors.phone.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="settings-language">{t('language')}</Label>
                <Select
                  value={profileForm.watch('languagePref') ?? 'BN'}
                  onValueChange={(v) =>
                    profileForm.setValue('languagePref', v as 'BN' | 'EN', {
                      shouldDirty: true,
                    })
                  }
                >
                  <SelectTrigger id="settings-language">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BN">{t('languageOptions.BN')}</SelectItem>
                    <SelectItem value="EN">{t('languageOptions.EN')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Appearance + Notifications form */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">{t('appearance')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {settingsLoading ? (
            <div className="text-sm text-muted-foreground">{tCommon('loading')}</div>
          ) : settingsLoadError ? (
            <div className="text-sm text-destructive">{settingsLoadError}</div>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="settings-theme">{t('theme')}</Label>
                <Select
                  value={settingsForm.watch('theme') ?? 'system'}
                  onValueChange={(v) =>
                    settingsForm.setValue('theme', v as 'light' | 'dark' | 'system', {
                      shouldDirty: true,
                    })
                  }
                >
                  <SelectTrigger id="settings-theme">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">{t('themeOptions.light')}</SelectItem>
                    <SelectItem value="dark">{t('themeOptions.dark')}</SelectItem>
                    <SelectItem value="system">{t('themeOptions.system')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">{t('notifications')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <label className="flex items-center justify-between gap-4 rounded-md border p-2">
            <span className="text-sm">{t('emailNotifications')}</span>
            <input
              type="checkbox"
              className="h-4 w-4"
              {...settingsForm.register('emailNotifications')}
            />
          </label>
          <label className="flex items-center justify-between gap-4 rounded-md border p-2">
            <span className="text-sm">{t('donationReceipts')}</span>
            <input
              type="checkbox"
              className="h-4 w-4"
              {...settingsForm.register('donationReceipts')}
            />
          </label>
        </CardContent>
      </Card>

      {/* Save + status */}
      <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:items-center sm:justify-between">
        <div
          className={cn(
            'flex items-center gap-2 text-sm',
            saveState === 'saved' && 'text-green-600',
            saveState === 'error' && 'text-destructive'
          )}
          role="status"
          aria-live="polite"
        >
          {saveState === 'saving' && (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>{t('saving')}</span>
            </>
          )}
          {saveState === 'saved' && (
            <>
              <Check className="h-4 w-4" />
              <span>{t('saved')}</span>
            </>
          )}
          {saveState === 'error' && saveError && (
            <span>{t('saveFailed', { message: saveError })}</span>
          )}
        </div>
        <Button onClick={onSave} disabled={isSaving || profileLoading || settingsLoading}>
          {isSaving ? t('saving') : t('saveChanges')}
        </Button>
      </div>
    </div>
  );
}
