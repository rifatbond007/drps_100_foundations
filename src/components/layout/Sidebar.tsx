/**
 * Sidebar navigation for authenticated pages.
 *
 * Grouped into three sections when admin (Main / Account / Admin) and
 * two sections otherwise (Main / Account). Sections use translated
 * headings from `nav.sections.*`. A sign-out button at the bottom uses
 * the same signOut() pattern as the UserMenu in the header.
 */
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { signOut } from 'next-auth/react';
import { Home, Heart, History, UserCircle, Users, BarChart, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

interface NavItem {
  href: string;
  labelKey: string;
  icon: typeof Home;
}

interface NavSection {
  headingKey?: 'sections.main' | 'sections.account' | 'sections.admin';
  items: NavItem[];
}

// Main section for regular users only — admins don't donate or browse
// personal donation history, so their sidebar skips this section entirely.
const userMainSection: NavSection = {
  headingKey: 'sections.main',
  items: [
    { href: '/dashboard', labelKey: 'dashboard', icon: Home },
    { href: '/donate', labelKey: 'donate', icon: Heart },
    { href: '/history', labelKey: 'history', icon: History },
  ],
};

// Account section is currently user-only. The Settings page is about
// the signed-in user's own profile/preferences; admins manage their own
// account the same way, so we keep this section for both roles.
const accountSection: NavSection = {
  headingKey: 'sections.account',
  items: [
    { href: '/settings', labelKey: 'profile', icon: UserCircle },
    // Settings page handles both profile + preferences; nav uses
    // `profile` as the label to reflect its primary purpose.
  ],
};
// Note: accountSection currently points at /settings under the label
// "Profile". If a dedicated /profile page is added later, split this.

/**
 * Build sidebar sections for the given role.
 *
 * Important: every item MUST point to a distinct route. The active-item
 * highlighter uses prefix-match, so two items with the same href would
 * both light up when one is clicked (the original bug — clicking the
 * navbar's "Dashboard" auto-selected "Users" because both routed to
 * /admin/users).
 *
 * Admin now gets three separate items, each on its own route:
 *   - Dashboard  → /admin/dashboard  (stat cards + shortcuts)
 *   - Users      → /admin/users      (management table)
 *   - Reports    → /admin/reports    (charts + CSV export)
 */
function buildSections(isAdmin: boolean): NavSection[] {
  if (isAdmin) {
    return [
      {
        headingKey: 'sections.admin',
        items: [
          { href: '/admin/dashboard', labelKey: 'dashboard', icon: Home },
          { href: '/admin/users', labelKey: 'users', icon: Users },
          { href: '/admin/reports', labelKey: 'reports', icon: BarChart },
        ],
      },
    ];
  }
  return [userMainSection, accountSection];
}

export function Sidebar({ isAdmin = false }: { isAdmin?: boolean }) {
  const locale = useLocale();
  const tNav = useTranslations('nav');
  const pathname = usePathname();

  const sections = buildSections(isAdmin);

  const handleSignOut = () => {
    void signOut({ callbackUrl: `/${locale}` });
  };

  return (
    <aside className="hidden h-full w-64 shrink-0 flex-col overflow-y-auto border-r bg-muted/30 md:flex">
      {/* Top section: scrollable nav. min-h-0 lets flex-1 actually shrink
          below its content height so overflow-y-auto can take over on
          short viewports / many sections. */}
      <nav className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4">
        {sections.map((section, idx) => (
          <div key={section.headingKey ?? `section-${idx}`} className="space-y-1">
            {section.headingKey && (
              <h3 className="px-3 pb-1 pt-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {tNav(section.headingKey)}
              </h3>
            )}
            {section.items.map((item) => {
              const Icon = item.icon;
              const fullHref = `/${locale}${item.href}`;
              const isActive = pathname === fullHref || pathname.startsWith(`${fullHref}/`);
              return (
                <Link
                  key={item.href}
                  href={fullHref}
                  className={cn(
                    'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-accent hover:text-accent-foreground'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tNav(item.labelKey)}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Bottom section: pinned sign-out. Uses shrink-0 so it never gets
          compressed when the nav above scrolls. */}
      <div className="shrink-0 border-t bg-background p-4">
        <Separator className="mb-3" />
        <Button variant="ghost" className="w-full justify-start" onClick={handleSignOut}>
          <LogOut className="mr-2 h-4 w-4" />
          {tNav('logout')}
        </Button>
      </div>
    </aside>
  );
}
