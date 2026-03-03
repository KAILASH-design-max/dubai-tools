'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Zap } from 'lucide-react';

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn("flex items-center gap-3 text-xl font-bold font-headline text-primary group", className)}>
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 transition-transform group-hover:scale-110">
        <Zap className="h-6 w-6 text-primary fill-primary/20" />
      </div>
      <div className="flex items-center gap-2">
        <span className="tracking-tight">DUBAI TOOLS</span>
      </div>
    </Link>
  );
}
