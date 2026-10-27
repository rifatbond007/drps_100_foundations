'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadError } from '@/components/ui/load-error';
import { PageHeader } from '@/components/ui/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DonationList } from '@/features/donation/donation-list';
import { useDonationHistoryInfinite } from '@/hooks/use-donations';
import { toAppLocale } from '@/lib/format';
import type { DonationStatus } from '@/types/donation';

const TABS = ['all', 'PENDING', 'SUCCESS', 'FAILED'] as const;
type Tab = (typeof TABS)[number];

export default function HistoryPage() {
  const locale = toAppLocale(useLocale());
  const t = useTranslations('history');
  const [tab, setTab] = useState<Tab>('all');
  const status: DonationStatus | undefined = tab === 'all' ? undefined : tab;
  const query = useDonationHistoryInfinite({ status });
  const items = query.data?.pages.flatMap((p) => p.donations) ?? [];

  return (
    <>
      <PageHeader title={t('title')} description={t('subtitle')} />
      <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)} className="mb-5">
        <TabsList>
          {TABS.map((key) => (
            <TabsTrigger key={key} value={key}>
              {t(`tabs.${key}`)}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {query.isLoading ? (
        <div className="flex flex-col gap-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      ) : query.isError ? (
        <LoadError message={t('loadFailed')} onRetry={() => void query.refetch()} />
      ) : items.length === 0 ? (
        <EmptyState icon={History} title={t('noDonations')} description={t('emptyBody')} />
      ) : (
        <>
          <DonationList items={items} locale={locale} />
          {query.hasNextPage && (
            <div className="mt-6 flex justify-center">
              <Button
                variant="outline"
                loading={query.isFetchingNextPage}
                onClick={() => void query.fetchNextPage()}
              >
                {t('loadMore')}
              </Button>
            </div>
          )}
        </>
      )}
    </>
  );
}
