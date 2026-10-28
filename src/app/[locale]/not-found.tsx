import Link from 'next/link';
import { getLocale, getTranslations } from 'next-intl/server';
import { Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatusPage } from '@/features/content/status-page';

export default async function NotFound() {
  const locale = await getLocale();
  const t = await getTranslations('errors');
  return (
    <StatusPage code="404" title={t('notFoundTitle')} body={t('notFoundBody')}>
      <Button asChild>
        <Link href={`/${locale}`}>
          <Home aria-hidden />
          {t('goHome')}
        </Link>
      </Button>
    </StatusPage>
  );
}
