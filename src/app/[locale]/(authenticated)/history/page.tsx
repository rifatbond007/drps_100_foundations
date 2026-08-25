'use client';

import { useTranslations } from 'next-intl';
import { DonationHistoryList } from '@/components/donation/DonationHistoryList';
import { useAuth } from '@/lib/hooks/use-auth';

export default function HistoryPage() {
  const t = useTranslations('history');
  const { user } = useAuth();

  if (!user) {
    return <div className="text-muted-foreground">{t('loading')}</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
        <p className="text-muted-foreground">{t('subtitle')}</p>
      </div>
      <DonationHistoryList userId={user.id} />
    </div>
  );
}
