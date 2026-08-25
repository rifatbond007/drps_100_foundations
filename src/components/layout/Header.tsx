/**
 * Site header. Server component.
 *
 * The "Sign in" button calls `signIn('google', { redirect: true })`
 * directly via the client-side `SignInButton`, so a click sends the
 * user straight to Google's account chooser — no intermediate
 * /{locale}/login page.
 */
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { auth } from '@/lib/auth/next-auth';
import { LanguageSwitcher } from './LanguageSwitcher';
import { SignInButton } from './SignInButton';
import { UserMenu } from './UserMenu';

export async function Header({ locale }: { locale: string }) {
  // Nav strings live in the `nav` namespace, not `common` — keys like
  // `about`, `dashboard`, `donate`, `history`, `login`, `logout` are
  // navigation labels, not generic UI strings.
  const t = await getTranslations({ locale, namespace: 'nav' });
  const session = await auth();
  const isLoggedIn = !!session?.user;
  const isAdmin = session?.user?.role === 'ADMIN';

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
          {isLoggedIn && isAdmin && (
            <>
              <Link href={`/${locale}/admin/users`} className="text-sm font-medium hover:underline">
                {t('dashboard')}
              </Link>
              <Link href={`/${locale}/admin/users`} className="text-sm font-medium hover:underline">
                {t('users')}
              </Link>
              <Link
                href={`/${locale}/admin/reports`}
                className="text-sm font-medium hover:underline"
              >
                {t('reports')}
              </Link>
            </>
          )}
          {isLoggedIn && !isAdmin && (
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
            <UserMenu
              locale={locale}
              name={session.user.name}
              email={session.user.email}
              avatarUrl={session.user.image ?? null}
              isAdmin={isAdmin}
            />
          ) : (
            <SignInButton locale={locale} label={t('login')} />
          )}
        </div>
      </div>
    </header>
  );
}
