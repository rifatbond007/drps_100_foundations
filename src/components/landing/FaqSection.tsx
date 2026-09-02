/**
 * FAQ section — Q&A as a register with click-to-expand rows.
 *
 * Same register language: hairline rows, no card chrome, no rounded
 * boxes. The answer sits between the same top and bottom hairlines
 * that frame each row. The disclosure state is shown by a single
 * glyph (a hairline cross / minus) at the right edge, the only place
 * the section touches colour beyond foreground/muted.
 *
 * Client component: the disclosure state has to live in the DOM.
 * Server-rendered initial state is "all closed".
 */
'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

const FAQ_KEYS = ['faq1', 'faq2', 'faq3', 'faq4'] as const;

export function FaqSection() {
  const t = useTranslations('landing');

  return (
    <section id="faq" className="border-t border-border bg-background">
      <div className="container py-14 sm:py-20">
        <h2 className="mb-3 max-w-2xl text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          {t('faqSectionTitle')}
        </h2>
        <p className="mb-10 max-w-3xl text-base leading-relaxed text-muted-foreground sm:text-lg">
          {t('faqSectionLead')}
        </p>

        <ol className="border-y border-border">
          {FAQ_KEYS.map((key, idx) => (
            <FaqRow
              key={key}
              n={toBengali(idx + 1)}
              question={t(`${key}Q`)}
              answer={t(`${key}A`)}
            />
          ))}
        </ol>
      </div>
    </section>
  );
}

/** A single FAQ row. Closed by default; clicking the question opens
 *  the answer with a quiet animated height transition (no big reveal
 *  choreography — the row simply unfolds). The glyph swaps between
 *  plus and minus. */
function FaqRow({ n, question, answer }: { n: string; question: string; answer: string }) {
  const [open, setOpen] = useState(false);

  return (
    <li className="border-b border-border last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="grid w-full grid-cols-[3rem_1fr_2rem] items-baseline gap-x-4 py-5 text-left transition-colors hover:bg-foreground/[0.02]"
      >
        <span aria-hidden="true" className="text-sm font-semibold tabular-nums text-primary">
          {n}
        </span>
        <span className="text-base font-semibold text-foreground sm:text-lg">{question}</span>
        <span
          aria-hidden="true"
          className="justify-self-end text-foreground"
          style={{ width: '1rem', height: '1rem', position: 'relative' }}
        >
          <span className="absolute left-1/2 top-1/2 h-px w-3 -translate-x-1/2 -translate-y-1/2 bg-current" />
          <span
            className="absolute left-1/2 top-1/2 h-3 w-px -translate-x-1/2 -translate-y-1/2 bg-current transition-transform duration-200"
            style={{ transform: `translate(-50%, -50%) scaleY(${open ? 0 : 1})` }}
          />
        </span>
      </button>
      {/* The answer block. Uses CSS grid-template-rows trick for a
       *  smooth, accessible height transition without measuring DOM. */}
      <div
        className="grid transition-[grid-template-rows] duration-200 ease-out"
        style={{ gridTemplateRows: open ? '1fr' : '0fr' }}
      >
        <div className="overflow-hidden">
          <p className="ml-[3.25rem] max-w-2xl pb-6 text-sm leading-relaxed text-muted-foreground sm:text-base">
            {answer}
          </p>
        </div>
      </div>
    </li>
  );
}

function toBengali(n: number): string {
  const map = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(n)
    .split('')
    .map((c) => map[Number(c)] ?? c)
    .join('');
}
