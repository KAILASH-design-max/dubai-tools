'use client';

import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn("flex items-center gap-3 text-xl font-bold font-headline text-primary group", className)}>
      <div className="flex h-10 w-10 items-center justify-center transition-transform group-hover:scale-110">
        <Image 
          src="/dubaitools.png" 
          alt="Dubai Tools Logo" 
          width={40} 
          height={40} 
          className="object-contain"
        />
      </div>
      <div className="flex items-center gap-2">
        <span className="tracking-tight uppercase">DUBAI TOOLS</span>
      </div>
    </Link>
  );
}
