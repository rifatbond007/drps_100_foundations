import { getTranslations, setRequestLocale } from 'next-intl/server';
import { LoginButton } from '@/components/auth/LoginButton';

export default async function LoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}) {
  const { locale } = await params;
  const { callbackUrl, error } = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations('auth');

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 px-4 py-16">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight">{t('loginTitle')}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t('loginSubtitle')}</p>
      </div>

      {error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {t(`errors.${error}`)}
        </div>
      )}

      <div className="rounded-lg border bg-card p-6 shadow-sm">
        <LoginButton callbackUrl={callbackUrl} />
      </div>

      <p className="text-center text-xs text-muted-foreground">{t('loginTerms')}</p>
    </div>
  );
}