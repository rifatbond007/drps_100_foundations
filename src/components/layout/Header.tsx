/**
 * Site header. Server component.
 *
 * Slim one-row layout — foundation wordmark on the left, language
 * switcher + auth control on the right. The previous build had a full
 * primary nav (Home / About / Blog / Alumni) in the middle of the
 * header; that was removed because:
 *   - The sidebar (authenticated pages) already covers in-product nav.
 *   - Landing-page nav should be part of the landing layout, not chrome
 *     that competes with the brand mark on every page.
 *
 * Mobile: brand on the left, three-dot trigger on the right. The drawer
 * slides in nav + auth + language switcher.
 *
 * Auth state comes from `auth()` so the server renders the right
 * controls without a client-side flicker.
 */
import Link from 'next/link';
import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import { auth } from '@/lib/auth/next-auth';
import { LanguageSwitcher } from './LanguageSwitcher';
import { SignInButton } from './SignInButton';
import { UserMenu } from './UserMenu';
import { MobileMenu } from './MobileMenu';

export async function Header({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: 'nav' });
  const session = await auth();
  const isLoggedIn = !!session?.user;
  const isAdmin = session?.user?.role === 'ADMIN';

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="container flex h-14 items-center justify-between gap-4">
        {/* Brand. Wordmark is the only label here — the foundation
         * crest lives to the left of it as a small mark. */}
        <Link
          href={`/${locale}`}
          className="group flex shrink-0 items-center gap-2 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          aria-label={t('home')}
        >
          <Image
            src="/images/logo.png"
            alt="DRPS Batch-19 Foundation"
            width={32}
            height={32}
            priority
            sizes="32px"
            className="h-8 w-8 shrink-0"
          />
          <span className="hidden text-base font-semibold tracking-tight text-foreground sm:inline">
            দান প্ল্যাটফর্ম
          </span>
        </Link>

        {/* Desktop right cluster */}
        <div className="hidden items-center gap-3 md:flex">
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

        {/* Mobile right cluster: three-dot menu trigger only */}
        <div className="flex items-center md:hidden">
          <MobileMenu
            locale={locale}
            labels={{
              home: t('home'),
              about: t('about'),
              blog: t('blog'),
              alumni: t('alumni'),
              dashboard: t('dashboard'),
              settings: t('settings'),
              history: t('history'),
              users: t('users'),
              reports: t('reports'),
              donations: t('donations'),
              sectionsMain: t('sections.main'),
              sectionsAccount: t('sections.account'),
              sectionsAdmin: t('sections.admin'),
              login: t('login'),
              logout: t('logout'),
            }}
            session={
              isLoggedIn
                ? {
                    name: session.user.name,
                    email: session.user.email,
                    image: session.user.image ?? null,
                    role: isAdmin ? 'ADMIN' : 'USER',
                  }
                : null
            }
          />
        </div>
      </div>
    </header>
  );
}
