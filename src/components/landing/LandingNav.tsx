/**
 * Landing page nav — a quiet editorial row that sits below the
 * masthead header on the landing route only.
 *
 * Same masthead wordmark logic: small type, tracked-out, hairline
 * rules above and below. Each link is an in-page anchor that scrolls
 * to a section id. Click handlers use native smooth scroll so the
 * server doesn't ship JS for the actual behaviour.
 *
 * Why this exists as a client component: we need to (a) intercept
 * clicks to do smooth scroll and update the URL hash without the
 * browser's default jump, and (b) render an aria-current state for
 * the section currently in view (IntersectionObserver).
 *
 * The links are flat, semantically ordered, and explicit: each one
 * corresponds to a real section on the page. No dropdowns, no
 * mega-menus. The nav is the table of contents rendered as type.
 */
'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useLocale } from 'next-intl';

interface NavItem {
  id: string;
  labelKey: string;
}

const NAV: NavItem[] = [
  { id: 'activity', labelKey: 'navActivity' },
  { id: 'causes', labelKey: 'navCauses' },
  { id: 'how', labelKey: 'navHow' },
  { id: 'people', labelKey: 'navPeople' },
  { id: 'events', labelKey: 'navEvents' },
  { id: 'stories', labelKey: 'navStories' },
  { id: 'faq', labelKey: 'navFaq' },
  { id: 'trust', labelKey: 'navTrust' },
];

const COPY: Record<string, Record<'bn' | 'en', string>> = {
  navActivity: { bn: 'লাইভ', en: 'Live' },
  navCauses: { bn: 'কোথায় যায়', en: 'Causes' },
  navHow: { bn: 'প্রক্রিয়া', en: 'Process' },
  navPeople: { bn: 'কারা', en: 'People' },
  navEvents: { bn: 'ইভেন্ট', en: 'Events' },
  navStories: { bn: 'গল্প', en: 'Stories' },
  navFaq: { bn: 'প্রশ্ন', en: 'FAQ' },
  navTrust: { bn: 'স্বচ্ছতা', en: 'Trust' },
};

export function LandingNav() {
  const rawLocale = useLocale();
  const loc: 'bn' | 'en' = rawLocale === 'en' ? 'en' : 'bn';
  const [active, setActive] = useState<string>('');

  // Observe which section is in view; mark it as current in the nav.
  // Threshold 0.4 because the sections are tall and we want the nav
  // to update when the user is "reading" the section, not just passing
  // its top edge.
  useEffect(() => {
    const targets = NAV.map((n) => document.getElementById(n.id)).filter(
      (el): el is HTMLElement => !!el
    );
    if (targets.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActive(visible.target.id);
      },
      { rootMargin: '-30% 0px -50% 0px', threshold: [0, 0.4, 1] }
    );

    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  // Smooth scroll on click. We update history manually so the back
  // button still works without forcing the browser's default jump.
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    const target = document.getElementById(id);
    if (!target) return;
    e.preventDefault();
    const headerOffset = 88; // masthead (h-14) + this nav row
    const top = target.getBoundingClientRect().top + window.scrollY - headerOffset;
    window.scrollTo({ top, behavior: 'smooth' });
    history.replaceState(null, '', `#${id}`);
  };

  return (
    <nav
      aria-label="Sections"
      className="sticky top-14 z-30 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80"
    >
      <div className="container">
        {/* Mobile: horizontally scrolling row of pills (no wrap).
         *  Desktop: flex row with hairline dividers between items. */}
        <ul className="flex gap-6 overflow-x-auto py-3 text-xs font-medium uppercase tracking-[0.14em] sm:gap-0 sm:overflow-visible sm:py-0 sm:text-[11px]">
          {NAV.map((item) => {
            const label = COPY[item.labelKey]?.[loc] ?? item.labelKey;
            const isActive = active === item.id;
            return (
              <li
                key={item.id}
                className="relative shrink-0 border-border py-3 sm:border-l sm:px-5 sm:first:border-l-0"
              >
                <Link
                  href={`#${item.id}`}
                  onClick={(e) => handleClick(e, item.id)}
                  aria-current={isActive ? 'true' : undefined}
                  className={
                    isActive
                      ? 'text-foreground'
                      : 'text-muted-foreground transition-colors hover:text-foreground'
                  }
                >
                  {label}
                </Link>
                {/* Active underline — a 2px rule under the active item
                 *  only. Hidden on mobile (scroll position is visible
                 *  enough there). This is the only section of the nav
                 *  that uses any colour beyond foreground/muted. */}
                {isActive && (
                  <span
                    aria-hidden="true"
                    className="absolute bottom-0 left-0 right-0 hidden h-0.5 bg-primary sm:block"
                  />
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
