/**
 * Sidebar navigation for authenticated pages.
 * SKELETON — fleshed out by frontend-agent phase.
 */
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Home, Heart, History, Settings, Users, BarChart } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  href: string;
  labelKey: string;
  icon: typeof Home;
  adminOnly?: boolean;
}

const items: NavItem[] = [
  { href: '/dashboard', labelKey: 'dashboard', icon: Home },
  { href: '/donate', labelKey: 'donate', icon: Heart },
  { href: '/history', labelKey: 'history', icon: History },
  { href: '/settings', labelKey: 'settings', icon: Settings },
];

export function Sidebar({ isAdmin = false }: { isAdmin?: boolean }) {
  const locale = useLocale();
  const t = useTranslations('nav');
  const pathname = usePathname();

  const allItems = [
    ...items,
    ...(isAdmin
      ? [
          { href: '/admin/users', labelKey: 'users', icon: Users, adminOnly: true },
          { href: '/admin/reports', labelKey: 'reports', icon: BarChart, adminOnly: true },
        ]
      : []),
  ];

  return (
    <aside className="hidden w-64 border-r bg-muted/30 md:block">
      <nav className="flex flex-col gap-1 p-4">
        {allItems.map((item) => {
          const Icon = item.icon;
          const fullHref = `/${locale}${item.href}`;
          const isActive = pathname.startsWith(fullHref);
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
              <span>{t(item.labelKey)}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
