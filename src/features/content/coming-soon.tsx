import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface ComingSoonProps {
  icon: LucideIcon;
  badge: string;
  title: string;
  subtitle: string;
  cardTitle: string;
  cardBody: string;
  homeHref: string;
  homeLabel: string;
}

export function ComingSoon({
  icon: Icon,
  badge,
  title,
  subtitle,
  cardTitle,
  cardBody,
  homeHref,
  homeLabel,
}: ComingSoonProps) {
  return (
    <div className="container flex max-w-3xl flex-col items-center py-16 text-center sm:py-24">
      <span className="flex size-16 items-center justify-center rounded-full bg-primary-soft text-primary-soft-foreground">
        <Icon className="size-8" aria-hidden />
      </span>
      <Badge variant="warning" className="mt-6">
        <Sparkles aria-hidden />
        {badge}
      </Badge>
      <h1 className="mt-4 text-balance text-4xl font-bold sm:text-5xl">{title}</h1>
      <p className="mt-4 text-balance text-lg text-muted-foreground">{subtitle}</p>
      <div className="mt-10 w-full rounded-lg border bg-card p-8 text-left shadow-card">
        <h2 className="text-xl font-semibold">{cardTitle}</h2>
        <p className="mt-2 text-muted-foreground">{cardBody}</p>
      </div>
      <Button asChild variant="ghost" className="mt-8">
        <Link href={homeHref}>
          <ArrowLeft aria-hidden />
          {homeLabel}
        </Link>
      </Button>
    </div>
  );
}
