'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Check, ClipboardCheck, Copy, X } from 'lucide-react';
import { toast } from 'sonner';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadError } from '@/components/ui/load-error';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DonationStatusBadge } from '@/features/donation/donation-status-badge';
import { donationReference } from '@/features/donation/reference';
import { useAdminDonations, type AdminDonation } from '@/hooks/use-admin';
import { causeFor } from '@/lib/config/causes';
import { formatBDT, formatDate, toAppLocale, type AppLocale } from '@/lib/format';
import { Pager } from './pager';
import { ReviewDialog } from './review-dialog';

const TABS = ['PENDING', 'SUCCESS', 'FAILED'] as const;
type Tab = (typeof TABS)[number];

export function ReviewQueue() {
  const locale = toAppLocale(useLocale());
  const t = useTranslations('admin.donations');
  const [tab, setTab] = useState<Tab>('PENDING');
  const [page, setPage] = useState(1);
  const [review, setReview] = useState<{
    mode: 'approve' | 'reject';
    donation: AdminDonation;
  } | null>(null);
  const query = useAdminDonations(tab, page);
  const items = query.data?.donations ?? [];

  return (
    <>
      <Tabs
        value={tab}
        onValueChange={(v) => {
          setTab(v as Tab);
          setPage(1);
        }}
        className="mb-5"
      >
        <TabsList>
          {TABS.map((key) => (
            <TabsTrigger key={key} value={key}>
              {t(`tabs.${key}`)}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {query.isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[0, 1].map((i) => (
            <Skeleton key={i} className="h-60 rounded-lg" />
          ))}
        </div>
      ) : query.isError ? (
        <LoadError message={t('loadFailed')} onRetry={() => void query.refetch()} />
      ) : items.length === 0 ? (
        <EmptyState icon={ClipboardCheck} title={t(tab === 'PENDING' ? 'empty' : 'emptyOther')} />
      ) : (
        <>
          <ul className="grid gap-4 md:grid-cols-2">
            {items.map((d) => (
              <ReviewCard
                key={d.id}
                donation={d}
                locale={locale}
                onApprove={() => setReview({ mode: 'approve', donation: d })}
                onReject={() => setReview({ mode: 'reject', donation: d })}
              />
            ))}
          </ul>
          <Pager page={page} totalPages={query.data?.pagination.totalPages ?? 1} onPage={setPage} />
        </>
      )}

      {review && (
        <ReviewDialog
          mode={review.mode}
          donation={review.donation}
          open
          onOpenChange={(open) => !open && setReview(null)}
          onDone={() => void query.refetch()}
        />
      )}
    </>
  );
}

function ReviewCard({
  donation: d,
  locale,
  onApprove,
  onReject,
}: {
  donation: AdminDonation;
  locale: AppLocale;
  onApprove: () => void;
  onReject: () => void;
}) {
  const t = useTranslations('admin.donations');
  const tPurpose = useTranslations('history.purposes');
  const { icon: Icon } = causeFor(d.purpose);
  const donorName = d.donor ? (d.donor.name ?? d.donor.email) : t('anonymous');

  const copyTrx = async () => {
    if (!d.trxId) return;
    try {
      await navigator.clipboard.writeText(d.trxId);
      toast.success(t('copy'));
    } catch {
      // Clipboard unavailable — the TrxID is visible on the card.
    }
  };

  return (
    <li className="flex flex-col rounded-lg border bg-card p-5 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar name={donorName} src={d.donor?.avatarUrl} />
          <div className="min-w-0">
            <p className="truncate font-semibold">{donorName}</p>
            {d.donor && <p className="truncate text-xs text-muted-foreground">{d.donor.email}</p>}
          </div>
        </div>
        <DonationStatusBadge status={d.status} />
      </div>

      <div className="mt-4 flex items-end justify-between gap-3 rounded-md bg-muted/60 p-4">
        <div>
          <p className="tabular text-2xl font-bold">{formatBDT(d.amount, locale)}</p>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
            <Icon className="size-4" aria-hidden />
            {tPurpose(d.purpose)}
          </p>
        </div>
        <p className="tabular text-right text-xs text-muted-foreground">
          {donationReference(d.id)}
        </p>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-xs text-muted-foreground">{t('trxId')}</dt>
          <dd className="tabular flex items-center gap-1 font-semibold">
            <span className="truncate">{d.trxId ?? '—'}</span>
            {d.trxId && (
              <button
                type="button"
                onClick={copyTrx}
                aria-label={t('copy')}
                className="rounded p-1 text-muted-foreground hover:bg-muted"
              >
                <Copy className="size-3.5" aria-hidden />
              </button>
            )}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">{t('senderPhone')}</dt>
          <dd className="tabular font-semibold">{d.senderPhone ?? '—'}</dd>
        </div>
        <div className="col-span-2">
          <dt className="text-xs text-muted-foreground">{t('submittedAt')}</dt>
          <dd>
            {formatDate(d.trxSubmittedAt ?? d.createdAt, locale, {
              dateStyle: 'medium',
              timeStyle: 'short',
            })}
          </dd>
        </div>
        {d.adminNote && (
          <div className="col-span-2 rounded-md bg-destructive-soft p-2 text-destructive">
            {d.adminNote}
          </div>
        )}
      </dl>

      {d.status === 'PENDING' && (
        <div className="mt-5 flex gap-2 border-t pt-4">
          <Button className="flex-1" onClick={onApprove}>
            <Check aria-hidden />
            {t('approve')}
          </Button>
          <Button
            variant="outline"
            className="flex-1 text-destructive hover:text-destructive"
            onClick={onReject}
          >
            <X aria-hidden />
            {t('reject')}
          </Button>
        </div>
      )}
    </li>
  );
}
