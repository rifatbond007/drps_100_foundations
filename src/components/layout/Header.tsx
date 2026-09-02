/**
 * Site header. Server component.
 *
 * Editorial chrome:
 *   - Foundation crest on the left, then the wordmark "DRPS19" set
 *     tight and small — it's an edition mark, not a logo billboard.
 *   - A short editorial line ("Issue · 2026") to the right of the
 *     wordmark on desktop only. This is the editorial move: the
 *     navbar reads as a magazine masthead rather than a SaaS chrome.
 *   - Language switcher + auth control on the right.
 *   - Mobile: brand on the left, hamburger on the right. The drawer
 *     covers all secondary nav (already designed).
 *
 * No primary nav in the header — the sidebar (authenticated) and the
 * hamburger drawer (mobile) cover in-product nav. The header carries
 * identity, language, and sign-in only.
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
  const year = new Date().getFullYear();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="container flex h-14 items-center justify-between gap-4">
        {/* Masthead: crest + wordmark + editorial issue line */}
        <Link
          href={`/${locale}`}
          className="group flex shrink-0 items-baseline gap-2 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          aria-label={t('home')}
        >
          <Image
            src="/images/logo.png"
            alt="DRPS Batch-19 Foundation"
            width={28}
            height={28}
            priority
            sizes="28px"
            className="h-7 w-7 shrink-0 self-center"
          />
          <span className="text-sm font-semibold tracking-[0.18em] text-foreground">DRPS19</span>
          <span
            aria-hidden="true"
            className="hidden text-[10px] font-medium uppercase tracking-[0.22em] text-muted-foreground lg:inline"
          >
            · Issue {year}
          </span>
        </Link>

        {/* Desktop right cluster */}
        <div className="hidden items-center gap-4 md:flex">
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

        {/* Mobile right cluster: hamburger trigger only */}
        <div className="flex items-center md:hidden">
          <MobileMenu
            locale={locale}
            labels={{
              home: t('home'),
              about: t('about'),
              blog: t('blog'),
              alumni: t('alumni'),
              dashboard: t('dashboard'),
              donate: t('donate'),
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
              language: 'Language',
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
