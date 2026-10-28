'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useLocale, useTranslations } from 'next-intl';
import { HeartHandshake, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SignInButton } from '@/features/auth/sign-in-button';
import { MARKETING_NAV } from '@/lib/config/site';
import { cn } from '@/lib/utils';
import { LanguageSwitcher } from './language-switcher';
import { Logo } from './logo';
import { MobileNav } from './mobile-nav';
import { ThemeToggle } from './theme-toggle';

export function SiteHeader() {
  const locale = useLocale();
  const pathname = usePathname();
  const { status } = useSession();
  const t = useTranslations('nav');
  const tCommon = useTranslations('common');
  const tA11y = useTranslations('a11y');
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const signedIn = status === 'authenticated';
  const actions = signedIn ? (
    <Button asChild size="sm">
      <Link href={`/${locale}/dashboard`}>
        <LayoutDashboard aria-hidden />
        {t('dashboard')}
      </Link>
    </Button>
  ) : (
    <>
      <SignInButton size="sm" />
      <Button asChild size="sm">
        <Link href={`/${locale}/donate`}>
          <HeartHandshake aria-hidden />
          {t('donate')}
        </Link>
      </Button>
    </>
  );

  return (
    // Floating bar: blends into the page at the top, becomes a frosted pill once scrolled.
    <header className="sticky top-0 z-40 py-2">
      <div className="container">
        <div
          className={cn(
            'flex h-12 items-center gap-3 rounded-full border pl-2 pr-1.5 transition-all duration-300 md:grid md:grid-cols-[1fr_auto_1fr]',
            scrolled
              ? 'border-border/70 bg-background/75 shadow-lift backdrop-blur-xl'
              : 'border-transparent bg-transparent'
          )}
        >
          <Logo href={`/${locale}`} name={tCommon('appName')} className="min-w-0" />

          <nav
            aria-label={tA11y('mainNav')}
            className="hidden h-9 items-center rounded-full bg-muted p-0.5 md:flex"
          >
            {MARKETING_NAV.map(({ key, path }) => {
              const href = `/${locale}${path}`;
              const active = pathname === href;
              return (
                <Link
                  key={key}
                  href={href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'flex h-8 items-center rounded-full px-4 text-sm font-medium transition-colors',
                    active
                      ? 'bg-card text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {t(key)}
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-1.5 md:justify-self-end">
            <LanguageSwitcher className="hidden sm:inline-flex" />
            <ThemeToggle />
            <div className="hidden items-center gap-1.5 md:flex [&_a]:rounded-full [&_button]:rounded-full">
              {actions}
            </div>
            <MobileNav footer={<div className="flex flex-col gap-2 [&>*]:w-full">{actions}</div>} />
          </div>
        </div>
      </div>
    </header>
  );
}
