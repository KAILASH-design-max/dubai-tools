'use client';

import { useState } from 'react';
import { Logo } from '@/components/logo';
import { 
  Menubar, 
  MenubarContent, 
  MenubarItem, 
  MenubarMenu, 
  MenubarSeparator, 
  MenubarTrigger 
} from '@/components/ui/menubar';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useRouter } from 'next/navigation';
import { useAuth } from '@/firebase';
import { signOut } from 'firebase/auth';
import { 
  Package, 
  Users, 
  ReceiptText, 
  Settings, 
  LogOut, 
  FileText, 
  Home, 
  Share2, 
  Menu,
  ChevronRight
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

export function MainHeader() {
  const router = useRouter();
  const auth = useAuth();
  const { toast } = useToast();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    if (!auth) return;
    try {
      await signOut(auth);
      router.push('/login');
      toast({
        title: "Signed Out",
        description: "You have been successfully signed out.",
      });
    } catch (e) {
      toast({ variant: 'destructive', title: 'Error', description: 'Sign out failed' });
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Dubai Tools',
        text: 'Manage invoices and inventory with Dubai Tools',
        url: window.location.origin,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.origin);
      toast({ title: 'Link Copied', description: 'URL copied to clipboard.' });
    }
  };

  const navigateTo = (path: string) => {
    router.push(path);
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card/80 backdrop-blur-sm print:hidden">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        <Logo />
        
        <div className="flex items-center gap-2">
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-4">
            <Menubar className="border-none bg-transparent">
              <MenubarMenu>
                <MenubarTrigger className="cursor-pointer flex items-center gap-1 font-headline">
                  <Home className="h-4 w-4" />
                  <span>Main</span>
                </MenubarTrigger>
                <MenubarContent>
                  <MenubarItem onClick={() => router.push('/')}>
                    <FileText className="mr-2 h-4 w-4" /> New Invoice
                  </MenubarItem>
                  <MenubarItem onClick={() => router.push('/invoices')}>
                    <ReceiptText className="mr-2 h-4 w-4" /> Invoice History
                  </MenubarItem>
                </MenubarContent>
              </MenubarMenu>

              <MenubarMenu>
                <MenubarTrigger className="cursor-pointer flex items-center gap-1 font-headline">
                  <Package className="h-4 w-4" />
                  <span>Inventory</span>
                </MenubarTrigger>
                <MenubarContent>
                  <MenubarItem onClick={() => router.push('/inventory')}>
                    <Package className="mr-2 h-4 w-4" /> Stock Management
                  </MenubarItem>
                </MenubarContent>
              </MenubarMenu>

              <MenubarMenu>
                <MenubarTrigger className="cursor-pointer flex items-center gap-1 font-headline">
                  <Users className="h-4 w-4" />
                  <span>Labor</span>
                </MenubarTrigger>
                <MenubarContent>
                  <MenubarItem onClick={() => router.push('/labor')}>
                    <Users className="mr-2 h-4 w-4" /> Labor & Records
                  </MenubarItem>
                </MenubarContent>
              </MenubarMenu>

              <MenubarMenu>
                <MenubarTrigger className="cursor-pointer flex items-center gap-1 font-headline">
                  <Settings className="h-4 w-4" />
                  <span>System</span>
                </MenubarTrigger>
                <MenubarContent>
                  <MenubarItem onClick={() => router.push('/settings')}>
                    <Settings className="mr-2 h-4 w-4" /> Profile & Settings
                  </MenubarItem>
                  <MenubarSeparator />
                  <MenubarItem onClick={handleShare}>
                    <Share2 className="mr-2 h-4 w-4" /> Share App
                  </MenubarItem>
                  <MenubarSeparator />
                  <MenubarItem className="text-destructive focus:text-destructive font-bold" onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" /> Sign Out
                  </MenubarItem>
                </MenubarContent>
              </MenubarMenu>
            </Menubar>
          </div>

          {/* Mobile Navigation Toggle */}
          <div className="flex md:hidden">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-10 w-10">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[280px] sm:w-[350px] p-0">
                <SheetHeader className="p-6 text-left border-b">
                  <SheetTitle>
                    <Logo className="text-lg" />
                  </SheetTitle>
                </SheetHeader>
                <div className="flex flex-col py-4">
                  <div className="px-6 py-2">
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">Invoicing</p>
                    <nav className="space-y-1">
                      <Button variant="ghost" className="w-full justify-start text-base font-normal h-12" onClick={() => navigateTo('/')}>
                        <FileText className="mr-3 h-5 w-5 text-primary" /> New Invoice
                        <ChevronRight className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                      <Button variant="ghost" className="w-full justify-start text-base font-normal h-12" onClick={() => navigateTo('/invoices')}>
                        <ReceiptText className="mr-3 h-5 w-5 text-primary" /> Invoice History
                        <ChevronRight className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </nav>
                  </div>
                  
                  <Separator className="my-2" />
                  
                  <div className="px-6 py-2">
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">Management</p>
                    <nav className="space-y-1">
                      <Button variant="ghost" className="w-full justify-start text-base font-normal h-12" onClick={() => navigateTo('/inventory')}>
                        <Package className="mr-3 h-5 w-5 text-primary" /> Inventory
                        <ChevronRight className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                      <Button variant="ghost" className="w-full justify-start text-base font-normal h-12" onClick={() => navigateTo('/labor')}>
                        <Users className="mr-3 h-5 w-5 text-primary" /> Labor
                        <ChevronRight className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </nav>
                  </div>

                  <Separator className="my-2" />

                  <div className="px-6 py-2">
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">Account</p>
                    <nav className="space-y-1">
                      <Button variant="ghost" className="w-full justify-start text-base font-normal h-12" onClick={() => navigateTo('/settings')}>
                        <Settings className="mr-3 h-5 w-5 text-primary" /> Settings
                        <ChevronRight className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                      <Button variant="ghost" className="w-full justify-start text-base font-normal h-12" onClick={() => { handleShare(); setIsMobileMenuOpen(false); }}>
                        <Share2 className="mr-3 h-5 w-5 text-primary" /> Share App
                      </Button>
                    </nav>
                  </div>

                  <div className="mt-auto px-6 pt-10 pb-6">
                    <Button variant="destructive" className="w-full" onClick={handleSignOut}>
                      <LogOut className="mr-2 h-4 w-4" /> Sign Out
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
