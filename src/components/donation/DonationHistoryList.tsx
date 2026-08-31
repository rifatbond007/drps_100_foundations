'use client';

/**
 * Donation history list.
 *
 * Renders the user's donations with status badges that reflect the
 * manual bKash workflow:
 *
 *   PENDING + no trxId   →  "TrxID not submitted yet" + link to
 *                           /donate/submit?id=<donationId>
 *   PENDING + trxId set  →  "Awaiting review" badge
 *   FAILED               →  status + admin note inline if present
 *   SUCCESS / CANCELLED  →  plain status label
 *
 * PENDING-but-trxId-submitted is the most important state to render
 * clearly: the donor has done their part and is waiting on the admin.
 * Showing just "Pending" was confusing — the old text was the same as
 * "you haven't paid yet".
 */
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { Clock, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useDonationHistory } from '@/lib/hooks/use-donations';
import { formatBDT } from '@/lib/utils';
import type { Donation } from '@/types/donation';

export function DonationHistoryList({ userId }: { userId: string }) {
  const t = useTranslations('history');
  const locale = useLocale();
  const { data, isLoading, error } = useDonationHistory(userId);

  if (isLoading) return <div className="text-muted-foreground">{t('loading')}</div>;
  if (error) {
    return <div className="text-destructive">{t('loadingFailed', { message: error.message })}</div>;
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
      {donations.map((d) => {
        const isPendingNoTrx = d.status === 'PENDING' && !d.trxId;
        const isPendingAwaiting = d.status === 'PENDING' && !!d.trxId;
        const isRejected = d.status === 'FAILED' && !!d.adminNote;
        return (
          <Card key={d.id}>
            <CardContent className="space-y-2 py-4">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="font-semibold">{formatBDT(d.amount)}</div>
                  <div className="truncate text-sm text-muted-foreground">
                    {t(`purposes.${d.purpose}`)}
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="text-sm font-medium">{t(`status.${d.status}`)}</div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(d.createdAt).toLocaleDateString(locale === 'en' ? 'en-US' : 'bn-BD')}
                  </div>
                </div>
              </div>

              {isPendingAwaiting && (
                <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-2 text-xs text-amber-900">
                  <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span>{t('awaitingReview')}</span>
                </div>
              )}

              {isPendingNoTrx && (
                <div className="flex items-center justify-between gap-2 rounded-md border border-yellow-200 bg-yellow-50 p-2 text-xs text-yellow-900">
                  <span>{t('trxNotSubmitted')}</span>
                  <Button asChild size="sm" variant="outline" className="h-7 px-2 text-xs">
                    <Link href={`/${locale}/donate/submit?id=${d.id}`}>{t('submitTrx')}</Link>
                  </Button>
                </div>
              )}

              {isRejected && (
                <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-2 text-xs text-red-900">
                  <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <div>
                    <div className="font-medium">{t('adminNoteLabel')}</div>
                    <div>{d.adminNote}</div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
