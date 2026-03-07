'use client';

import { Logo } from '@/components/logo';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export function MainHeader() {
  const pathname = usePathname();
  const { toast } = useToast();

  // Hide header on login/signup pages
  if (pathname === '/login' || pathname === '/signup') {
    return null;
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 print:hidden">
      <div className="container flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <SidebarTrigger className="h-9 w-9" />
          <div className="md:hidden">
            <Logo className="text-base" />
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Share button removed as requested */}
        </div>
      </div>
    </header>
  );
}
