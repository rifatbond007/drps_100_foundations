'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { APP_NAV } from '@/lib/config/nav';
import { cn } from '@/lib/utils';

interface AppNavProps {
  role: 'USER' | 'ADMIN';
  collapsed?: boolean;
  onNavigate?: () => void;
}

/** Grouped app navigation, shared by the desktop sidebar and the mobile sheet. */
export function AppNav({ role, collapsed = false, onNavigate }: AppNavProps) {
  const locale = useLocale();
  const pathname = usePathname();
  const t = useTranslations('nav');
  const isAdmin = role === 'ADMIN';

  return (
    <nav className="flex flex-col gap-6">
      {APP_NAV.filter((g) => !g.adminOnly || isAdmin).map((group) => (
        <div key={group.section}>
          {!collapsed && (
            <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t(`sections.${group.section}`)}
            </p>
          )}
          <ul className="flex flex-col gap-1">
            {group.items
              .filter((item) => !(item.userOnly && isAdmin))
              .map(({ key, path, icon: Icon }) => {
                const href = `/${locale}${path}`;
                const active = pathname === href || pathname.startsWith(`${href}/`);
                return (
                  <li key={key}>
                    <Link
                      href={href}
                      onClick={onNavigate}
                      aria-current={active ? 'page' : undefined}
                      title={collapsed ? t(key) : undefined}
                      className={cn(
                        'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
                        collapsed && 'justify-center px-0',
                        active
                          ? 'bg-primary-soft text-primary-soft-foreground'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      )}
                    >
                      <Icon className="size-5 shrink-0" aria-hidden />
                      <span className={cn(collapsed && 'sr-only')}>{t(key)}</span>
                    </Link>
                  </li>
                );
              })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
