'use client';

import { useTranslations } from 'next-intl';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Pager({
  page,
  totalPages,
  onPage,
}: {
  page: number;
  totalPages: number;
  onPage: (p: number) => void;
}) {
  const t = useTranslations('admin.users.pagination');
  if (totalPages <= 1) return null;
  return (
    <div className="mt-5 flex items-center justify-between gap-3">
      <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onPage(page - 1)}>
        <ChevronLeft aria-hidden />
        {t('prev')}
      </Button>
      <p className="text-sm text-muted-foreground">{t('page', { page, total: totalPages })}</p>
      <Button
        variant="outline"
        size="sm"
        disabled={page >= totalPages}
        onClick={() => onPage(page + 1)}
      >
        {t('next')}
        <ChevronRight aria-hidden />
      </Button>
    </div>
  );
}
