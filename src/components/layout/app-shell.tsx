'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Menu, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogTitle, DialogTrigger, SheetContent } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { AppNav } from './app-sidebar';
import { LanguageSwitcher } from './language-switcher';
import { Logo } from './logo';
import { ThemeToggle } from './theme-toggle';
import { UserMenu } from './user-menu';

export interface ShellUser {
  name: string;
  email: string;
  image?: string | null;
  role: 'USER' | 'ADMIN';
}

const COLLAPSE_KEY = 'app-sidebar-collapsed';

/** Signed-in chrome: sidebar on desktop, sheet nav on mobile, top bar with account controls. */
export function AppShell({ user, children }: { user: ShellUser; children: ReactNode }) {
  const locale = useLocale();
  const tCommon = useTranslations('common');
  const tNav = useTranslations('nav');
  const tA11y = useTranslations('a11y');
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(COLLAPSE_KEY) === '1');
    } catch {
      // Storage unavailable (private mode) — keep the default.
    }
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      try {
        localStorage.setItem(COLLAPSE_KEY, prev ? '0' : '1');
      } catch {
        // Ignore — the toggle still works for this visit.
      }
      return !prev;
    });
  };

  const brand = (
    <div className="flex min-w-0 items-center gap-2">
      <Logo href={`/${locale}`} name={tCommon('appName')} className="min-w-0" />
      {user.role === 'ADMIN' && <Badge variant="warning">{tNav('admin')}</Badge>}
    </div>
  );

  return (
    <div className="flex min-h-screen">
      <aside
        className={cn(
          'sticky top-0 hidden h-screen shrink-0 flex-col border-r bg-card transition-[width] md:flex',
          collapsed ? 'w-[76px]' : 'w-64'
        )}
      >
        <div
          className={cn('flex h-16 items-center border-b px-4', collapsed && 'justify-center px-0')}
        >
          {collapsed ? <Logo href={`/${locale}`} name="" /> : brand}
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          <AppNav role={user.role} collapsed={collapsed} />
        </div>
        <div className={cn('border-t p-3', collapsed && 'flex justify-center')}>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleCollapsed}
            aria-label={tA11y(collapsed ? 'expandSidebar' : 'collapseSidebar')}
            className={cn(!collapsed && 'w-full justify-start')}
          >
            {collapsed ? <PanelLeftOpen aria-hidden /> : <PanelLeftClose aria-hidden />}
          </Button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b bg-background/80 px-4 backdrop-blur-md sm:px-6">
          <Dialog open={mobileOpen} onOpenChange={setMobileOpen}>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                aria-label={tA11y('openMenu')}
              >
                <Menu aria-hidden />
              </Button>
            </DialogTrigger>
            <SheetContent
              closeLabel={tA11y('closeMenu')}
              aria-describedby={undefined}
              className="left-0 right-auto border-l-0 border-r data-[state=open]:slide-in-from-left"
            >
              <DialogTitle className="sr-only">{tA11y('mainNav')}</DialogTitle>
              <div className="pr-8">{brand}</div>
              <div className="mt-4 overflow-y-auto">
                <AppNav role={user.role} onNavigate={() => setMobileOpen(false)} />
              </div>
            </SheetContent>
          </Dialog>
          <div className="min-w-0 md:hidden">{brand}</div>
          <div className="ml-auto flex items-center gap-1.5">
            <LanguageSwitcher className="hidden sm:inline-flex" />
            <ThemeToggle />
            <UserMenu user={user} />
          </div>
        </header>
        <main className="flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-10">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
