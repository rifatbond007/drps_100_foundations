/**
 * Site header. Server component.
 *
 * Single-row layout, responsive:
 *   - Mobile (<md): brand on the left, three-dot menu trigger on the
 *     right. Public nav, language switcher, and auth control all live
 *     inside the mobile drawer (`MobileMenu`) so the navbar itself
 *     stays compact.
 *   - Desktop (≥md): brand + `PublicNav` centered + language switcher
 *     + auth control on the right.
 *
 * Authenticated users reach their dashboard, settings, and admin pages
 * from the profile-picture dropdown in `UserMenu` on desktop, or from
 * the Account/Admin section of the mobile drawer on phones.
 *
 * The "Sign in" button calls `signIn('google', { redirect: true })`
 * directly via the client-side `SignInButton`, so a click sends the
 * user straight to Google's account chooser — no intermediate
 * /{locale}/login page.
 */
import Link from 'next/link';
import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import { auth } from '@/lib/auth/next-auth';
import { PublicNav } from '@/components/marketing/PublicNav';
import { LanguageSwitcher } from './LanguageSwitcher';
import { SignInButton } from './SignInButton';
import { UserMenu } from './UserMenu';
import { MobileMenu } from './MobileMenu';

export async function Header({ locale }: { locale: string }) {
  // The "nav" namespace owns every label rendered here (about, dashboard,
  // donate, history, login, logout). Using `common` would make the keys
  // fall through to themselves, since they don't live under common.
  const t = await getTranslations({ locale, namespace: 'nav' });
  const session = await auth();
  const isLoggedIn = !!session?.user;
  const isAdmin = session?.user?.role === 'ADMIN';

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="container flex h-16 items-center justify-between gap-3">
        <Link
          href={`/${locale}`}
          className="group flex shrink-0 items-center gap-3 rounded-md outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          aria-label={t('home')}
        >
          {/*
            Foundation crest. Source PNG is 1254×1254 — next/image will
            serve a properly-sized WebP. `priority` because the logo is
            the LCP element on every page. h-9 (36px) on mobile, h-10
            (40px) on ≥sm. The white parts of the source PNG are
            transparent, so the circular crest sits cleanly on the
            navbar's translucent white background.
          */}
          <Image
            src="/images/logo.png"
            alt="DRPS Batch-19 Foundation"
            width={40}
            height={40}
            priority
            sizes="(min-width: 640px) 40px, 36px"
            className="h-9 w-9 shrink-0 sm:h-10 sm:w-10"
          />
          {/*
            Wordmark + tagline. Hidden on the smallest screens so the
            logo alone carries the brand; visible from sm up where
            horizontal space allows it. Tracking-tight tightens the
            kerning so the Bangla glyphs read as a unit rather than
            separate characters.
          */}
          <span className="hidden flex-col leading-tight sm:flex">
            <span className="text-base font-bold tracking-tight text-foreground lg:text-lg">
              দান প্ল্যাটফর্ম
            </span>
            <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground lg:text-xs">
              DRPS Batch-19 Foundation
            </span>
          </span>
        </Link>

        {/* Public nav — hidden on small screens to leave room for the auth control. */}
        <div className="hidden md:flex md:flex-1 md:justify-center">
          <PublicNav />
        </div>

        {/*
          Desktop right cluster: language switcher + auth. Hidden on
          mobile because those controls live inside MobileMenu instead.
        */}
        <div className="hidden shrink-0 items-center gap-2 md:flex">
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

        {/*
          Mobile right cluster: just the three-dot menu trigger. The
          full nav + auth + language switcher slide in from the right
          when tapped. Only visible <md so it doesn't duplicate the
          desktop controls.
        */}
        <div className="flex shrink-0 items-center md:hidden">
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
