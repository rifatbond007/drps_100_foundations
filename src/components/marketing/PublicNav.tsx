'use client';

/**
 * Public marketing nav — shown on EVERY page above the auth-aware row in
 * Header.tsx. Items: Home, About, Blog, Alumni.
 *
 * Two reasons this lives in its own component even though the Header
 * already has a `nav` element:
 *   1. Item labels come from a different namespace (`nav.*` with new
 *      blog/alumni keys) and the active-state highlighter needs the
 *      pathname to prefix-match against the locale-aware href.
 *   2. Keeping it isolated means future additions (Pricing, Partners)
 *      can ship as a single-file change without touching the auth row.
 *
 * Active state uses exact-match on the locale-stripped path so
 * /en/blog and /en/blog/some-post both highlight the Blog item without
 * accidental collisions on /en/blogger or similar.
 */
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

interface PublicNavItem {
  href: string;
  labelKey: 'home' | 'about' | 'blog' | 'alumni';
}

const ITEMS: PublicNavItem[] = [
  { href: '', labelKey: 'home' },
  { href: '/about', labelKey: 'about' },
  { href: '/blog', labelKey: 'blog' },
  { href: '/alumni', labelKey: 'alumni' },
];

function stripLocale(pathname: string, locale: string): string {
  const prefix = `/${locale}`;
  return pathname.startsWith(prefix) ? pathname.slice(prefix.length) : pathname;
}

export function PublicNav() {
  const locale = useLocale();
  const t = useTranslations('nav');
  const pathname = usePathname();
  const stripped = stripLocale(pathname ?? '/', locale);

  return (
    <nav aria-label="Public" className="flex items-center gap-1 sm:gap-2">
      {ITEMS.map((item) => {
        const href = `/${locale}${item.href}`;
        // Home matches "/" exactly; other items match by prefix.
        const isActive =
          item.href === '' ? stripped === '' || stripped === '/' : stripped.startsWith(item.href);
        return (
          <Link
            key={item.href || 'home'}
            href={href}
            aria-current={isActive ? 'page' : undefined}
            className={cn(
              'rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors sm:px-3',
              isActive
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-accent hover:text-foreground'
            )}
          >
            {t(item.labelKey)}
          </Link>
        );
      })}
    </nav>
  );
}
