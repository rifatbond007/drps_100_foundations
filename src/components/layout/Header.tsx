/**
 * Site header. Server component.
 *
 * Two-row layout:
 *   - Top row (always shown, public): brand on the left, `PublicNav`
 *     (Home/About/Blog/Alumni) centered/left, language switcher + auth
 *     control on the right.
 *   - Bottom row (donors only): shows context-specific links — signed-in
 *     donors see Dashboard / Donate / History. Admins and signed-out users
 *     see nothing extra here (admins use the sidebar for admin navigation).
 *
 * The "Sign in" button calls `signIn('google', { redirect: true })`
 * directly via the client-side `SignInButton`, so a click sends the
 * user straight to Google's account chooser — no intermediate
 * /{locale}/login page.
 */
import Link from 'next/link';
import { Heart } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { auth } from '@/lib/auth/next-auth';
import { PublicNav } from '@/components/marketing/PublicNav';
import { LanguageSwitcher } from './LanguageSwitcher';
import { SignInButton } from './SignInButton';
import { UserMenu } from './UserMenu';

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
      {/* Row 1 — always public: brand + PublicNav + auth control */}
      <div className="container flex h-16 items-center justify-between gap-4">
        <Link
          href={`/${locale}`}
          className="flex shrink-0 items-center gap-2"
          aria-label={t('home')}
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Heart className="h-4 w-4 fill-primary/30" />
          </span>
          <span className="text-base font-bold sm:text-lg">দান প্ল্যাটফর্ম</span>
        </Link>

        {/* Public nav — hidden on small screens to leave room for the auth control. */}
        <div className="hidden md:flex md:flex-1 md:justify-center">
          <PublicNav />
        </div>

        <div className="flex shrink-0 items-center gap-2">
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

      {/* Row 2 — donor context row. Admins intentionally do NOT get a
          second row here; their Dashboard / Users / Reports links live in
          the sidebar so they don't crowd the public marketing nav. On
          mobile this scrolls horizontally so all items remain reachable. */}
      {isLoggedIn && !isAdmin && (
        <div className="border-t bg-muted/40">
          <div className="container flex h-12 items-center gap-1 overflow-x-auto">
            <Link
              href={`/${locale}/dashboard`}
              className="whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              {t('dashboard')}
            </Link>
            <Link
              href={`/${locale}/donate`}
              className="whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              {t('donate')}
            </Link>
            <Link
              href={`/${locale}/history`}
              className="whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              {t('history')}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
