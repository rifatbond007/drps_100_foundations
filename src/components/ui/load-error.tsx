'use client';

import { useTranslations } from 'next-intl';
import { CircleAlert, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

/** Inline failure state with a retry button — never silent zeros. */
export function LoadError({ message, onRetry }: { message: string; onRetry: () => void }) {
  const t = useTranslations('common');
  return (
    <div
      role="alert"
      className="flex flex-col items-start gap-3 rounded-lg border border-destructive/30 bg-destructive-soft p-5 sm:flex-row sm:items-center"
    >
      <CircleAlert className="size-5 shrink-0 text-destructive" aria-hidden />
      <p className="flex-1 text-sm font-medium text-destructive">{message}</p>
      <Button variant="outline" size="sm" onClick={onRetry}>
        <RotateCcw aria-hidden />
        {t('retry')}
      </Button>
    </div>
  );
}
