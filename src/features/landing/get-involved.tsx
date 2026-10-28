'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowUpRight, CalendarDays, Check, HandHeart, Share2, Users } from 'lucide-react';
import { SectionHeading } from './section-heading';

const tileClass =
  'group flex h-full flex-col rounded-xl border bg-card p-7 text-left shadow-card transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-lift focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

function TileBody({
  icon: Icon,
  title,
  body,
  done = false,
}: {
  icon: typeof HandHeart;
  title: string;
  body: string;
  done?: boolean;
}) {
  return (
    <>
      <div className="flex items-start justify-between">
        <span className="flex size-12 items-center justify-center rounded-full bg-primary-soft text-primary-soft-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
          {done ? (
            <Check className="size-6" aria-hidden />
          ) : (
            <Icon className="size-6" aria-hidden />
          )}
        </span>
        <ArrowUpRight
          className="size-5 text-muted-foreground transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary"
          aria-hidden
        />
      </div>
      <h3 className="mt-8 text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-muted-foreground">{body}</p>
    </>
  );
}

export function GetInvolved({ locale }: { locale: string }) {
  const t = useTranslations('landing');
  const [shared, setShared] = useState(false);

  // Native share sheet where available (phones), otherwise copy the link.
  const share = async () => {
    const url = `${window.location.origin}/${locale}`;
    try {
      if (navigator.share) {
        await navigator.share({ url, title: document.title });
        return;
      }
      await navigator.clipboard.writeText(url);
      setShared(true);
      setTimeout(() => setShared(false), 2500);
    } catch {
      // User cancelled the share sheet, or clipboard was blocked: nothing to do.
    }
  };

  const links = [
    { icon: HandHeart, n: 1, href: `/${locale}/donate` },
    { icon: CalendarDays, n: 2, href: '#events' },
    { icon: Users, n: 3, href: `/${locale}/alumni` },
  ] as const;

  return (
    <section className="container py-20 sm:py-28">
      <SectionHeading
        eyebrow={t('involvedEyebrow')}
        title={t('involvedTitle')}
        lead={t('involvedLead')}
      />
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {links.map(({ icon, n, href }) => (
          <li key={n}>
            <Link href={href} className={tileClass}>
              <TileBody icon={icon} title={t(`involved${n}Title`)} body={t(`involved${n}Body`)} />
            </Link>
          </li>
        ))}
        <li>
          <button type="button" onClick={share} className={`${tileClass} w-full`}>
            <TileBody
              icon={Share2}
              title={t('involved4Title')}
              body={shared ? t('involvedShared') : t('involved4Body')}
              done={shared}
            />
          </button>
        </li>
      </ul>
      {/* Announce the copy confirmation to screen readers. */}
      <p className="sr-only" aria-live="polite">
        {shared ? t('involvedShared') : ''}
      </p>
    </section>
  );
}
