/**
 * Organisations shown in the landing page's "In collaboration with" strip.
 * Placeholders — replace with real partners (and their permission); logo
 * files live in public/images/partners/. `href` is optional.
 */
export interface Partner {
  name: string;
  logo: string;
  href?: string;
}

export const PARTNERS: readonly Partner[] = [
  { name: 'Partner A', logo: '/images/partners/partner-1.svg' },
  { name: 'Partner B', logo: '/images/partners/partner-2.svg' },
  { name: 'Partner C', logo: '/images/partners/partner-3.svg' },
  { name: 'Partner D', logo: '/images/partners/partner-4.svg' },
  { name: 'Partner E', logo: '/images/partners/partner-5.svg' },
  { name: 'Partner F', logo: '/images/partners/partner-6.svg' },
];
