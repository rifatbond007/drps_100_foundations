'use client';

import Link from 'next/link';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogTitle, DialogTrigger, SheetContent } from '@/components/ui/dialog';
import { LanguageSwitcher } from './language-switcher';
import { MARKETING_NAV } from '@/lib/config/site';
import { cn } from '@/lib/utils';

/** Slide-over navigation for small screens. `footer` holds the auth actions. */
export function MobileNav({ footer }: { footer: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const locale = useLocale();
  const pathname = usePathname();
  const t = useTranslations('nav');
  const tA11y = useTranslations('a11y');

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden" aria-label={tA11y('openMenu')}>
          <Menu aria-hidden />
        </Button>
      </DialogTrigger>
      <SheetContent closeLabel={tA11y('closeMenu')} aria-describedby={undefined}>
        <DialogTitle className="sr-only">{tA11y('mainNav')}</DialogTitle>
        <nav aria-label={tA11y('mainNav')} className="mt-10 flex flex-col gap-1">
          {MARKETING_NAV.map(({ key, path }) => {
            const href = `/${locale}${path}`;
            const active = pathname === href;
            return (
              <Link
                key={key}
                href={href}
                onClick={() => setOpen(false)}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'rounded-md px-3 py-2.5 text-base font-medium',
                  active ? 'bg-primary-soft text-primary-soft-foreground' : 'hover:bg-muted'
                )}
              >
                {t(key)}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto flex flex-col gap-3 border-t pt-4" onClick={() => setOpen(false)}>
          <LanguageSwitcher className="self-start" />
          {footer}
        </div>
      </SheetContent>
    </Dialog>
  );
}
