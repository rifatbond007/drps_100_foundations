/**
 * Sidebar navigation for authenticated pages.
 *
 * Editorial register layout:
 *   - One eyebrow header per area (Main / Admin) above its list of
 *     items. The header is a small uppercase label that names what
 *     the section is for — not a navigation step itself.
 *   - Each list is a single register: items separated by hairline
 *     rules, no card chrome. The active item carries an inset
 *     emerald left bar (border-l-2 border-l-primary) and bold type.
 *   - Hover state is a faint background tint.
 *   - Sign-out lives at the bottom of the sidebar as a quiet hairline-
 *     separated row.
 *
 * Hidden below md — the mobile drawer (MobileMenu) covers nav there.
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

// Regular user — Main section only. The /donate page guards that route
// server-side for admins; this just keeps the link out of the admin
// sidebar.
const userItems: NavItem[] = [
  { href: '/dashboard', labelKey: 'dashboard' },
  { href: '/donate', labelKey: 'donate' },
  { href: '/history', labelKey: 'history' },
  { href: '/settings', labelKey: 'profile' },
];

// Admin — Admin section only (admins don't see donor-facing nav here).
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
    <aside className="hidden w-60 shrink-0 border-r border-border md:block">
      <nav className="sticky top-14 flex max-h-[calc(100dvh-3.5rem)] flex-col">
        <div className="flex-1 overflow-y-auto px-4 py-6">
          <Section title={isAdmin ? tNav('sections.admin') : tNav('sections.account')}>
            {items.map((item) => {
              const fullHref = `/${locale}${item.href}`;
              const isActive = pathname === fullHref || pathname.startsWith(`${fullHref}/`);
              return (
                <Item
                  key={item.href}
                  href={fullHref}
                  active={isActive}
                  label={tNav(item.labelKey)}
                />
              );
            })}
          </Section>
        </div>

        <button
          type="button"
          onClick={handleSignOut}
          className="flex shrink-0 items-center gap-2 border-t border-border px-4 py-3 text-left text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" />
          {tNav('logout')}
        </button>
      </nav>
    </aside>
  );
}

/** Section heading inside the sidebar. Eyebrow label + the register of
 *  items below it, separated by hairline rules. */
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </p>
      <ul className="border-y border-border">{children}</ul>
    </div>
  );
}

/** Single sidebar row. Hairline divider between siblings is provided by
 *  `border-b border-border last:border-b-0`. Active item carries an
 *  inset emerald left bar. */
function Item({ href, active, label }: { href: string; active: boolean; label: string }) {
  return (
    <li className="border-b border-border last:border-b-0">
      <Link
        href={href}
        aria-current={active ? 'page' : undefined}
        className={cn(
          'relative flex h-10 items-center pl-4 pr-3 text-sm transition-colors',
          'border-l-2',
          active
            ? 'border-l-primary bg-primary/5 font-semibold text-foreground'
            : 'border-l-transparent text-muted-foreground hover:bg-accent hover:text-foreground'
        )}
      >
        {label}
      </Link>
    </li>
  );
}
