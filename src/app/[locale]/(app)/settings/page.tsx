'use client';

import { useTranslations } from 'next-intl';
import { LoadError } from '@/components/ui/load-error';
import { PageHeader } from '@/components/ui/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { PreferencesForm } from '@/features/profile/preferences-form';
import { ProfileForm } from '@/features/profile/profile-form';
import { useProfile } from '@/hooks/use-profile';

export default function SettingsPage() {
  const t = useTranslations('settings');
  const profile = useProfile();

  return (
    <div className="max-w-3xl">
      <PageHeader title={t('title')} description={t('subtitle')} />
      {profile.isLoading ? (
        <div className="flex flex-col gap-6">
          <Skeleton className="h-80 w-full rounded-lg" />
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>
      ) : profile.isError || !profile.data ? (
        <LoadError message={t('loadFailed')} onRetry={() => void profile.refetch()} />
      ) : (
        <div className="flex flex-col gap-6">
          <ProfileForm profile={profile.data} />
          <PreferencesForm languagePref={profile.data.languagePref} />
        </div>
      )}
    </div>
  );
}
