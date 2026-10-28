import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ArrowRight, MessageSquareWarning } from 'lucide-react';
import { causeFor } from '@/lib/config/causes';
import { formatBDT, formatDate, type AppLocale } from '@/lib/format';
import type { Donation } from '@/types/donation';
import { DonationStatusBadge } from './donation-status-badge';

interface DonationListProps {
  items: Donation[];
  locale: AppLocale;
}

export function DonationList({ items, locale }: DonationListProps) {
  return (
    <ul className="divide-y rounded-lg border bg-card shadow-card">
      {items.map((d) => (
        <DonationListItem key={d.id} donation={d} locale={locale} />
      ))}
    </ul>
  );
}

function DonationListItem({ donation: d, locale }: { donation: Donation; locale: AppLocale }) {
  const t = useTranslations('history');
  const { icon: Icon } = causeFor(d.purpose);
  const needsTrx = d.status === 'PENDING' && !d.trxId;
  const inReview = d.status === 'PENDING' && !!d.trxId;

  return (
    <li className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-4 sm:p-5">
      <div className="flex min-w-0 flex-1 items-center gap-4">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-md bg-primary-soft text-primary-soft-foreground">
          <Icon className="size-5" aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="font-semibold">{t(`purposes.${d.purpose}`)}</p>
          <p className="text-sm text-muted-foreground">
            {formatDate(d.createdAt, locale)}
            {inReview && <> · {t('awaitingReview')}</>}
          </p>
          {d.status === 'FAILED' && d.adminNote && (
            <p className="mt-1 flex items-start gap-1.5 text-sm text-destructive">
              <MessageSquareWarning className="mt-0.5 size-4 shrink-0" aria-hidden />
              <span>
                {t('adminNoteLabel')}: {d.adminNote}
              </span>
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center justify-between gap-4 pl-[3.75rem] sm:justify-end sm:pl-0">
        <p className="tabular font-bold">{formatBDT(d.amount, locale)}</p>
        <DonationStatusBadge status={d.status} />
      </div>
      {needsTrx && (
        <Link
          href={`/${locale}/donate/submit?id=${d.id}`}
          className="inline-flex items-center gap-1 self-start pl-[3.75rem] text-sm font-semibold text-primary sm:self-center sm:pl-0"
        >
          {t('submitTrx')}
          <ArrowRight className="size-4" aria-hidden />
        </Link>
      )}
    </li>
  );
}
