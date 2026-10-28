import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface LogoProps {
  href: string;
  name: string;
  className?: string;
}

export function Logo({ href, name, className }: LogoProps) {
  return (
    <Link href={href} className={cn('flex items-center gap-2.5 font-bold', className)}>
      <Image
        src="/images/logo.png"
        alt=""
        width={36}
        height={36}
        className="size-9 rounded-full"
        priority
      />
      <span className="truncate text-base sm:text-lg">{name}</span>
    </Link>
  );
}
