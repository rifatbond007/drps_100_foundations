/**
 * Donation history list.
 * SKELETON — fleshed out by frontend-agent phase.
 */
'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent } from '@/components/ui/card';
import { useDonationHistory } from '@/lib/hooks/use-donations';
import { formatBDT } from '@/lib/utils';
import type { Donation } from '@/types/donation';

export function DonationHistoryList({ userId }: { userId: string }) {
  const t = useTranslations('history');
  const { data, isLoading, error } = useDonationHistory(userId);

  if (isLoading) return <div className="text-muted-foreground">{t('loading')}</div>;
  if (error) {
    return (
      <div className="text-destructive">
        {t('loadingFailed', { message: error.message })}
      </div>
    );
  }

  const donations: Donation[] = data?.donations ?? [];

  if (donations.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          {t('noDonations')}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {donations.map((d) => (
        <Card key={d.id}>
          <CardContent className="flex items-center justify-between py-4">
            <div>
              <div className="font-semibold">{formatBDT(d.amount)}</div>
              <div className="text-sm text-muted-foreground">
                {t(`purposes.${d.purpose}`)}
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium">{t(`status.${d.status}`)}</div>
              <div className="text-xs text-muted-foreground">
                {new Date(d.createdAt).toLocaleDateString()}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
