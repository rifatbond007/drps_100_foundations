'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { Home, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatusPage } from '@/features/content/status-page';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const locale = useLocale();
  const t = useTranslations('errors');

  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error(error);
  }, [error]);

  return (
    <StatusPage title={t('errorTitle')} body={t('errorBody')}>
      <Button onClick={reset}>
        <RotateCcw aria-hidden />
        {t('tryAgain')}
      </Button>
      <Button asChild variant="outline">
        <Link href={`/${locale}`}>
          <Home aria-hidden />
          {t('goHome')}
        </Link>
      </Button>
      {error.digest && (
        <p className="tabular w-full text-xs text-muted-foreground">
          {t('reference', { id: error.digest })}
        </p>
      )}
    </StatusPage>
  );
}
