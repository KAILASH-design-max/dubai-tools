'use client';

import { Logo } from '@/components/logo';
import { 
  Menubar, 
  MenubarContent, 
  MenubarItem, 
  MenubarMenu, 
  MenubarSeparator, 
  MenubarTrigger 
} from '@/components/ui/menubar';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/firebase';
import { signOut } from 'firebase/auth';
import { Package, Users, ReceiptText, Settings, LogOut, FileText, Home, Share2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function MainHeader() {
  const router = useRouter();
  const auth = useAuth();
  const { toast } = useToast();

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

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card/80 backdrop-blur-sm print:hidden">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        <Logo />
        <div className="flex items-center gap-4">
          <Menubar className="border-none bg-transparent">
            <MenubarMenu>
              <MenubarTrigger className="cursor-pointer flex items-center gap-1 font-headline">
                <Home className="h-4 w-4" />
                <span className="hidden sm:inline">Main</span>
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
                <span className="hidden sm:inline">Inventory</span>
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
                <span className="hidden sm:inline">Labor</span>
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
                <span className="hidden sm:inline">System</span>
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
      </div>
    </header>
  );
}
