import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { PARTNERS, type Partner } from '@/lib/config/partners';

/** "In collaboration with" strip between the hero and the causes. */
export function Partners() {
  const t = useTranslations('landing');
  return (
    <section className="container pt-8 sm:pt-12">
      <div className="border-y py-8">
        <PartnerMarquee label={t('partnersLabel')} />
      </div>
    </section>
  );
}

/**
 * Partner logos gliding right to left in a seamless loop: the list is
 * rendered twice and the track slides by half its width. Pauses on hover;
 * stands still for reduced-motion users.
 */
export function PartnerMarquee({ label }: { label: string }) {
  return (
    <div>
      <div className="group relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]">
        <div className="flex w-max animate-marquee group-hover:[animation-play-state:paused] motion-reduce:animate-none">
          {[0, 1].map((copy) => (
            <ul
              key={copy}
              aria-hidden={copy === 1 || undefined}
              aria-label={copy === 0 ? label : undefined}
              className="flex shrink-0 items-center gap-12 pr-12 sm:gap-16 sm:pr-16"
            >
              {PARTNERS.map((partner) => (
                <li key={partner.name} className="shrink-0">
                  <PartnerLogo partner={partner} focusable={copy === 0} />
                </li>
              ))}
            </ul>
          ))}
        </div>
      </div>
    </div>
  );
}

function PartnerLogo({ partner, focusable }: { partner: Partner; focusable: boolean }) {
  const logo = (
    <Image
      src={partner.logo}
      alt={partner.name}
      width={168}
      height={48}
      className="h-9 w-auto opacity-60 grayscale transition duration-300 hover:opacity-100 hover:grayscale-0 dark:invert"
    />
  );
  if (!partner.href) return logo;
  return (
    <a
      href={partner.href}
      target="_blank"
      rel="noopener noreferrer"
      tabIndex={focusable ? undefined : -1}
    >
      {logo}
    </a>
  );
}
