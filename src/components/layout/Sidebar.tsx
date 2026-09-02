/**
 * Sidebar navigation for authenticated pages.
 *
 * Vertical register of links — no section labels, no icon squares.
 * The active item is marked by a 2px emerald bar on its left edge and
 * bolded text. Hover state is a faint background tint, no rounded
 * chip.
 *
 * Each item points to a distinct route; the active highlighter uses
 * prefix-match so /admin/users highlights while editing a user, but
 * the dashboard sibling route does not light up by accident.
 */
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { signOut } from 'next-auth/react';
import { LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  href: string;
  labelKey: 'dashboard' | 'donate' | 'history' | 'profile' | 'users' | 'reports' | 'donations';
}

// Regular user — three items, no Donate shortcut for admins (the
// /donate page guards that server-side; this just removes the dead link).
const userItems: NavItem[] = [
  { href: '/dashboard', labelKey: 'dashboard' },
  { href: '/donate', labelKey: 'donate' },
  { href: '/history', labelKey: 'history' },
  { href: '/settings', labelKey: 'profile' },
];

// Admin — four items, each on a distinct route.
const adminItems: NavItem[] = [
  { href: '/admin/dashboard', labelKey: 'dashboard' },
  { href: '/admin/users', labelKey: 'users' },
  { href: '/admin/donations', labelKey: 'donations' },
  { href: '/admin/reports', labelKey: 'reports' },
];

export function Sidebar({ isAdmin = false }: { isAdmin?: boolean }) {
  const locale = useLocale();
  const tNav = useTranslations('nav');
  const pathname = usePathname();
  const items = isAdmin ? adminItems : userItems;

  const handleSignOut = () => {
    void signOut({ callbackUrl: `/${locale}` });
  };

  return (
    <aside className="hidden w-52 shrink-0 border-r border-border md:block">
      <nav className="sticky top-14 flex flex-col gap-6 px-4 py-6">
        <ul className="flex flex-col">
          {items.map((item) => {
            const fullHref = `/${locale}${item.href}`;
            const isActive = pathname === fullHref || pathname.startsWith(`${fullHref}/`);
            return (
              <li key={item.href}>
                <Link
                  href={fullHref}
                  aria-current={isActive ? 'page' : undefined}
                  className={cn(
                    'relative block py-2 pl-4 pr-2 text-sm transition-colors',
                    'border-l-2 border-transparent',
                    'hover:bg-secondary',
                    isActive
                      ? 'border-l-primary font-semibold text-foreground'
                      : 'text-muted-foreground'
                  )}
                >
                  {tNav(item.labelKey)}
                </Link>
              </li>
            );
          })}
        </ul>

        <button
          type="button"
          onClick={handleSignOut}
          className="self-start pl-4 text-left text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <LogOut className="mr-2 inline h-4 w-4 align-text-bottom" aria-hidden="true" />
          {tNav('logout')}
        </button>
      </nav>
    </aside>
  );
}
