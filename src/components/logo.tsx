
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export function Logo({ className }: { className?: string }) {
  const logoImage = PlaceHolderImages.find(img => img.id === 'app-logo');

  return (
    <Link href="/" className={cn("flex items-center gap-3 text-xl font-bold font-headline text-primary group", className)}>
      <div className="relative h-10 w-10 overflow-hidden rounded-lg bg-primary/10 transition-transform group-hover:scale-105">
        {logoImage ? (
          <Image
            src={logoImage.imageUrl}
            alt={logoImage.description}
            width={40}
            height={40}
            className="object-cover"
            data-ai-hint={logoImage.imageHint}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="text-lg text-primary font-bold">DT</span>
          </div>
        )}
      </div>
      <span className="tracking-tight">DUBAI TOOLS</span>
    </Link>
  );
}
