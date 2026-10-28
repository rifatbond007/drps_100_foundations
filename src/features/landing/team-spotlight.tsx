'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useId, useRef, useState, type KeyboardEvent } from 'react';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface TeamMember {
  name: string;
  role: string;
  desc: string;
  image: string;
}

interface TeamSpotlightProps {
  heading: React.ReactNode;
  members: TeamMember[];
  join: { title: string; body: string; cta: string; href: string };
}

/**
 * Committee list beside a spotlight card. Hovering, clicking or arrowing
 * through the list swaps the spotlight; portraits cross-fade.
 */
export function TeamSpotlight({ heading, members, join }: TeamSpotlightProps) {
  const [active, setActive] = useState(0);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const id = useId();
  const member = members[active]!;

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const delta = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
    if (!delta) return;
    e.preventDefault();
    const next = (active + delta + members.length) % members.length;
    setActive(next);
    tabRefs.current[next]?.focus();
  };

  return (
    <div className="grid gap-10 lg:grid-cols-[5fr_7fr] lg:items-center lg:gap-20">
      {/* Phones: heading, spotlight, then list. Desktop: heading and list share a column. */}
      <div className="contents lg:flex lg:flex-col">
        <div className="order-1 lg:order-none">{heading}</div>
        <div className="order-3 lg:order-none">
          <div
            role="tablist"
            aria-orientation="vertical"
            onKeyDown={onKeyDown}
            className="border-t"
          >
            {members.map((m, i) => {
              const selected = i === active;
              return (
                <button
                  key={m.name}
                  ref={(el) => {
                    tabRefs.current[i] = el;
                  }}
                  type="button"
                  role="tab"
                  id={`${id}-tab-${i}`}
                  aria-selected={selected}
                  aria-controls={`${id}-panel`}
                  tabIndex={selected ? 0 : -1}
                  onClick={() => setActive(i)}
                  onMouseEnter={() => setActive(i)}
                  className="group flex w-full items-center gap-4 border-b py-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span className="relative size-10 shrink-0 overflow-hidden rounded-full bg-muted">
                    <Image
                      src={m.image}
                      alt=""
                      fill
                      sizes="40px"
                      className={cn(
                        'origin-[50%_30%] scale-[1.7] object-cover transition',
                        !selected && 'opacity-60 grayscale'
                      )}
                    />
                  </span>
                  <span
                    className={cn(
                      'min-w-0 flex-1 truncate font-medium transition-colors',
                      selected
                        ? 'text-foreground'
                        : 'text-muted-foreground group-hover:text-foreground'
                    )}
                  >
                    {m.name}
                  </span>
                  <span className="shrink-0 text-sm text-muted-foreground">{m.role}</span>
                </button>
              );
            })}
          </div>

          <Link
            href={join.href}
            className="group mt-6 inline-flex flex-wrap items-baseline gap-x-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span className="text-muted-foreground">{join.title}</span>
            <span className="inline-flex items-center gap-1 font-medium text-primary">
              {join.cta}
              <ArrowRight
                aria-hidden
                className="size-3.5 transition-transform group-hover:translate-x-0.5"
              />
            </span>
          </Link>
        </div>
      </div>

      <div
        role="tabpanel"
        id={`${id}-panel`}
        aria-labelledby={`${id}-tab-${active}`}
        className="order-2 lg:order-none"
      >
        <div className="grid overflow-hidden rounded-2xl border bg-card sm:grid-cols-[1fr_1.1fr]">
          <div className="relative aspect-[4/5] bg-muted sm:aspect-auto sm:min-h-[26rem]">
            {/* All portraits stay mounted so switching cross-fades without a reload. */}
            {members.map((m, i) => (
              <Image
                key={m.name}
                src={m.image}
                alt={i === active ? m.name : ''}
                fill
                sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw"
                className={cn(
                  'object-cover object-[50%_30%] transition-opacity duration-500',
                  i === active ? 'opacity-100' : 'opacity-0'
                )}
              />
            ))}
          </div>
          {/* Re-keyed so the details fade in on every switch. */}
          <div
            key={active}
            className="flex flex-col justify-end p-7 duration-500 animate-in fade-in-0 motion-reduce:animate-none sm:p-9"
          >
            <p className="text-xs font-medium uppercase tracking-wider text-primary">
              {member.role}
            </p>
            <h3 className="mt-3 text-balance text-3xl font-semibold leading-tight">
              {member.name}
            </h3>
            <p className="mt-3 text-muted-foreground">{member.desc}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
