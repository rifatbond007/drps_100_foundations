import { useTranslations } from 'next-intl';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { SectionHeading } from './section-heading';

const QUESTIONS = [1, 2, 3, 4] as const;

export function Faq() {
  const t = useTranslations('landing');
  return (
    <section id="faq" className="scroll-mt-20 border-y bg-muted/40 py-20 sm:py-28">
      <div className="container grid gap-10 lg:grid-cols-[2fr_3fr] lg:gap-20">
        <SectionHeading
          eyebrow={t('faqEyebrow')}
          title={t('faqTitle')}
          lead={t('faqLead')}
          className="mb-0 sm:mb-0 lg:sticky lg:top-28 lg:self-start"
        />
        <Accordion type="single" collapsible className="divide-y border-y">
          {QUESTIONS.map((n) => (
            <AccordionItem
              key={n}
              value={`q${n}`}
              className="rounded-none border-0 bg-transparent px-0 shadow-none"
            >
              <AccordionTrigger className="py-6 text-lg hover:text-primary">
                {t(`faq${n}Q`)}
              </AccordionTrigger>
              <AccordionContent>
                <p className="max-w-xl text-base">{t(`faq${n}A`)}</p>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
