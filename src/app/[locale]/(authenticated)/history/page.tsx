'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/hooks/use-auth';
import { useDonationHistory } from '@/lib/hooks/use-donations';
import { formatBDT } from '@/lib/utils';
import { cn } from '@/lib/utils';

/**
 * /history — every donation the user has made, in a register layout.
 *
 * No cards per row — each donation is a single line in a numbered list.
 * Status uses the same colour key as the dashboard (primary/destructive/
 * admin/muted) so the user doesn't have to relearn it.
 *
 * PENDING-but-no-trxId is a special state: the donor created the row
 * but never finished the bKash step. We show a one-line note + a
 * continue button right under the row.
 */
export default function HistoryPage() {
  const t = useTranslations('history');
  const { user } = useAuth();
  const locale = useLocale();
  const { data, isLoading, error } = useDonationHistory(user?.id);

  if (!user) return null;

  const donations = data?.donations ?? [];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t('subtitle')}</p>
      </header>

      {isLoading && (
        <p className="py-8 text-center text-sm text-muted-foreground">{t('loading')}</p>
      )}

      {error && (
        <p
          role="alert"
          className="border-l-2 border-destructive bg-destructive/5 px-3 py-2 text-sm text-destructive"
        >
          {t('loadingFailed', { message: error.message })}
        </p>
      )}

      {!isLoading && !error && donations.length === 0 && (
        <div className="border-t border-border py-12 text-center">
          <p className="text-sm text-muted-foreground">{t('noDonations')}</p>
        </div>
      )}

      {!isLoading && !error && donations.length > 0 && (
        <ol className="border-t border-border">
          {donations.map((d) => {
            const isPendingNoTrx = d.status === 'PENDING' && !d.trxId;
            const isPendingAwaiting = d.status === 'PENDING' && !!d.trxId;
            const isRejected = d.status === 'FAILED' && !!d.adminNote;
            return (
              <li key={d.id} className="border-b border-border py-4">
                <div className="flex items-baseline justify-between gap-4">
                  <div className="min-w-0">
                    <div className="truncate text-base font-semibold tabular-nums text-foreground">
                      {formatBDT(d.amount)}
                    </div>
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      {t(`purposes.${d.purpose}`)}
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div
                      className={cn(
                        'text-sm font-medium',
                        d.status === 'SUCCESS' && 'text-primary',
                        d.status === 'FAILED' && 'text-destructive',
                        d.status === 'PENDING' && 'text-admin',
                        d.status === 'CANCELLED' && 'text-muted-foreground'
                      )}
                    >
                      {t(`status.${d.status}`)}
                    </div>
                    <time className="text-xs tabular-nums text-muted-foreground">
                      {new Date(d.createdAt).toLocaleDateString(
                        locale === 'en' ? 'en-US' : 'bn-BD'
                      )}
                    </time>
                  </div>
                </div>

                {isPendingAwaiting && (
                  <p className="mt-2 text-xs text-admin">{t('awaitingReview')}</p>
                )}

                {isPendingNoTrx && (
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs text-muted-foreground">{t('trxNotSubmitted')}</span>
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/${locale}/donate/submit?id=${d.id}`}>{t('submitTrx')}</Link>
                    </Button>
                  </div>
                )}

                {isRejected && (
                  <p className="mt-2 text-xs text-destructive">
                    <span className="font-medium">{t('adminNoteLabel')}:</span> {d.adminNote}
                  </p>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
