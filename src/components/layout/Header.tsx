/**
 * Site header. Server component.
 */
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { auth } from '@/lib/auth/next-auth';
import { LanguageSwitcher } from './LanguageSwitcher';
import { SignOutButton } from './SignOutButton';
import { Button } from '@/components/ui/button';

export async function Header({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: 'common' });
  const session = await auth();
  const isLoggedIn = !!session?.user;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
      <div className="container flex h-16 items-center justify-between">
        <Link href={`/${locale}`} className="flex items-center space-x-2">
          <span className="text-xl font-bold">দান প্ল্যাটফর্ম</span>
        </Link>

        <nav className="hidden gap-6 md:flex">
          <Link href={`/${locale}/about`} className="text-sm font-medium hover:underline">
            {t('about')}
          </Link>
          {isLoggedIn && (
            <>
              <Link href={`/${locale}/dashboard`} className="text-sm font-medium hover:underline">
                {t('dashboard')}
              </Link>
              <Link href={`/${locale}/donate`} className="text-sm font-medium hover:underline">
                {t('donate')}
              </Link>
              <Link href={`/${locale}/history`} className="text-sm font-medium hover:underline">
                {t('history')}
              </Link>
            </>
          )}
        </nav>

        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          {isLoggedIn ? (
            <SignOutButton label={t('logout')} />
          ) : (
            <Button asChild size="sm">
              <Link href={`/${locale}/login`}>{t('login')}</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
