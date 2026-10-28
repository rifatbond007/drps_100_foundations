import type { DonationPurpose } from '@prisma/client';
import { BookOpen, HandHeart, HeartPulse, Siren, type LucideIcon } from 'lucide-react';

export interface Cause {
  purpose: DonationPurpose;
  icon: LucideIcon;
  /** Fundraising goal in BDT. Placeholder values — edit to the foundation's real targets. */
  goal: number;
  /** Card photo. Placeholder (see public/images/landing/README.md) — swap for a photo of this fund's work. */
  image: string;
  /** `landing.*` message keys. */
  nameKey: string;
  descKey: string;
}

export const CAUSES: readonly Cause[] = [
  {
    purpose: 'GENERAL_FUND',
    icon: HandHeart,
    goal: 100_000,
    image: '/images/landing/03.jpg',
    nameKey: 'causeGeneralName',
    descKey: 'causeGeneralDesc',
  },
  {
    purpose: 'EDUCATION',
    icon: BookOpen,
    goal: 75_000,
    image: '/images/landing/08.jpg',
    nameKey: 'causeEducationName',
    descKey: 'causeEducationDesc',
  },
  {
    purpose: 'MEDICAL',
    icon: HeartPulse,
    goal: 50_000,
    image: '/images/landing/14.jpg',
    nameKey: 'causeMedicalName',
    descKey: 'causeMedicalDesc',
  },
  {
    purpose: 'EMERGENCY',
    icon: Siren,
    goal: 25_000,
    image: '/images/landing/27.jpg',
    nameKey: 'causeEmergencyName',
    descKey: 'causeEmergencyDesc',
  },
];

export const causeFor = (purpose: DonationPurpose): Cause =>
  CAUSES.find((c) => c.purpose === purpose) ?? CAUSES[0]!;
