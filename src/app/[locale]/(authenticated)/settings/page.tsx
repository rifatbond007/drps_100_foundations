/**
 * Authenticated settings page.
 *
 * Two stacked sections (Profile, Preferences) separated by hairline
 * rules. No card chrome — sections are just titled blocks with form
 * fields flowing vertically inside.
 *
 * Profile fields and preferences share one Save button at the bottom.
 * Saving runs both PATCH /users/profile and PUT /users/settings in
 * parallel.
 */
'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Check, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: { name: '', phone: '', languagePref: 'BN' },
    mode: 'onBlur',
  });

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

  useEffect(() => {
    if (profile) {
      profileForm.reset({
        name: profile.name ?? '',
        phone: profile.phone ?? '',
        languagePref: profile.languagePref,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id]);

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
      tasks.push(apiClient.put<UserSettings>('/users/settings', settingsData));

      await Promise.all(tasks);
      setSaveState('saved');
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
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t('subtitle')}</p>
        {profileName && (
          <p className="mt-3 text-sm text-foreground">
            {profileName}
            {profileEmail && (
              <span className="ml-2 text-xs text-muted-foreground">· {profileEmail}</span>
            )}
          </p>
        )}
      </header>

      {/* Profile */}
      <section className="space-y-4 border-t border-border pt-6">
        <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {t('profile')}
        </h2>
        {profileLoading ? (
          <p className="text-sm text-muted-foreground">{tCommon('loading')}</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
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
          </div>
        )}
      </section>

      {/* Preferences */}
      <section className="space-y-4 border-t border-border pt-6">
        <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {t('notifications')}
        </h2>
        {settingsLoading ? (
          <p className="text-sm text-muted-foreground">{tCommon('loading')}</p>
        ) : settingsLoadError ? (
          <p className="text-sm text-destructive">{settingsLoadError}</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
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

            <div className="space-y-3 sm:col-span-2">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-primary"
                  {...settingsForm.register('emailNotifications')}
                />
                <span className="text-sm">{t('emailNotifications')}</span>
              </label>
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-primary"
                  {...settingsForm.register('donationReceipts')}
                />
                <span className="text-sm">{t('donationReceipts')}</span>
              </label>
            </div>
          </div>
        )}
      </section>

      {/* Save + status */}
      <div className="flex flex-col gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
        <div
          className={cn(
            'flex items-center gap-2 text-sm',
            saveState === 'saved' && 'text-primary',
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
        <button
          type="button"
          onClick={onSave}
          disabled={isSaving || profileLoading || settingsLoading}
          className="inline-flex h-10 items-center justify-center bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50"
        >
          {isSaving ? t('saving') : t('saveChanges')}
        </button>
      </div>
    </div>
  );
}
