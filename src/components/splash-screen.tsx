'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

export function SplashScreen() {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 1800); // Display for 1.8 seconds
    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background animate-in fade-in duration-500">
      <div className="relative flex flex-col items-center">
        {/* Animated Logo */}
        <div className="relative h-32 w-32 animate-bounce">
          <Image 
            src="/dubaitools.png" 
            alt="Dubai Tools Logo" 
            fill
            className="object-contain"
            priority
          />
        </div>
        
        {/* Animated Branding */}
        <div className="mt-8 text-center space-y-2">
          <h1 className="text-3xl font-bold font-headline tracking-tighter text-primary animate-pulse uppercase">
            DUBAI TOOLS
          </h1>
          <div className="h-1 w-12 bg-accent mx-auto rounded-full" />
          <p className="text-[10px] text-muted-foreground uppercase tracking-[0.3em] font-medium opacity-70">
            Powering Professional Excellence
          </p>
        </div>
      </div>
      
      {/* Decorative background element */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-2">
        <div className="h-1.5 w-1.5 rounded-full bg-primary/20 animate-ping" />
        <span className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-widest">Initialising Systems</span>
      </div>
    </div>
  );
}
