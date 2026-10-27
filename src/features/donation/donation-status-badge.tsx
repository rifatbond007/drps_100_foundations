import { useTranslations } from 'next-intl';
import { CircleCheck, CircleX, Clock, Ban } from 'lucide-react';
import { Badge, donationStatusVariant } from '@/components/ui/badge';
import type { DonationStatus } from '@/types/donation';

const ICONS = { PENDING: Clock, SUCCESS: CircleCheck, FAILED: CircleX, CANCELLED: Ban } as const;

export function DonationStatusBadge({ status }: { status: DonationStatus }) {
  const t = useTranslations('history.status');
  const Icon = ICONS[status];
  return (
    <Badge variant={donationStatusVariant(status)}>
      <Icon aria-hidden />
      {t(status)}
    </Badge>
  );
}
