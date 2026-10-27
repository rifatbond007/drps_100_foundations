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
    <section id="faq" className="bg-muted/50 py-16 sm:py-24">
      <div className="container max-w-3xl">
        <SectionHeading title={t('faqTitle')} lead={t('faqLead')} />
        <Accordion type="single" collapsible className="flex flex-col gap-3">
          {QUESTIONS.map((n) => (
            <AccordionItem key={n} value={`q${n}`}>
              <AccordionTrigger>{t(`faq${n}Q`)}</AccordionTrigger>
              <AccordionContent>{t(`faq${n}A`)}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
