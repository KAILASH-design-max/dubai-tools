'use client';

import * as React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useUser, useAuth, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { signOut } from 'firebase/auth';
import { collection, query, where } from 'firebase/firestore';
import { Invoice, InventoryItem, LaborRecord } from '@/lib/types';
import {
  ReceiptText,
  Package,
  Users,
  Settings,
  LogOut,
  LayoutDashboard,
  PlusCircle,
  ChevronRight,
  User as UserIcon,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuBadge,
  useSidebar,
} from '@/components/ui/sidebar';
import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export function AppSidebar() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const { setOpenMobile, state } = useSidebar();

  // Data fetching for badges
  const invoicesRef = useMemoFirebase(
    () => (firestore && user ? collection(firestore, `users/${user.uid}/invoices`) : null),
    [firestore, user]
  );
  const pendingInvoicesQuery = useMemoFirebase(
    () => (invoicesRef ? query(invoicesRef, where('status', 'in', ['Sent', 'Overdue'])) : null),
    [invoicesRef]
  );

  const inventoryRef = useMemoFirebase(
    () => (firestore && user ? collection(firestore, `users/${user.uid}/inventory`) : null),
    [firestore, user]
  );

  const laborRecordsRef = useMemoFirebase(
    () => (firestore && user ? collection(firestore, `users/${user.uid}/laborRecords`) : null),
    [firestore, user]
  );
  const pendingLaborQuery = useMemoFirebase(
    () => (laborRecordsRef ? query(laborRecordsRef, where('status', '==', 'Pending')) : null),
    [laborRecordsRef]
  );

  const { data: pendingInvoices } = useCollection<Invoice>(pendingInvoicesQuery);
  const { data: inventoryItems } = useCollection<InventoryItem>(inventoryRef);
  const { data: pendingLabor } = useCollection<LaborRecord>(pendingLaborQuery);

  const lowStockCount = React.useMemo(() => {
    if (!inventoryItems) return 0;
    return inventoryItems.filter(item => 
      item.minStockLevel !== undefined && item.quantity <= item.minStockLevel
    ).length;
  }, [inventoryItems]);

  const pendingInvoiceCount = pendingInvoices?.length || 0;
  const pendingLaborCount = pendingLabor?.length || 0;

  // Don't show sidebar on auth pages or if not logged in
  if (isUserLoading || !user || user.isAnonymous || pathname === '/login' || pathname === '/signup') {
    return null;
  }

  const handleSignOut = async () => {
    if (!auth) return;
    try {
      await signOut(auth);
      setOpenMobile(false);
      router.push('/login');
      toast({
        title: "Signed Out",
        description: "You have been successfully signed out.",
      });
    } catch (e) {
      toast({ variant: 'destructive', title: 'Error', description: 'Sign out failed' });
    }
  };

  const handleNavigation = (url: string) => {
    router.push(url);
    setOpenMobile(false);
  };

  const menuGroups = [
    {
      label: "Invoicing",
      items: [
        { title: "New Invoice", icon: PlusCircle, url: "/" },
        { 
          title: "Invoice History", 
          icon: ReceiptText, 
          url: "/invoices",
          badge: pendingInvoiceCount > 0 ? pendingInvoiceCount : null,
          badgeVariant: 'default'
        },
      ]
    },
    {
      label: "Management",
      items: [
        { 
          title: "Inventory", 
          icon: Package, 
          url: "/inventory",
          badge: lowStockCount > 0 ? lowStockCount : null,
          badgeVariant: 'destructive'
        },
        { 
          title: "Labor Management", 
          icon: Users, 
          url: "/labor",
          badge: pendingLaborCount > 0 ? pendingLaborCount : null,
          badgeVariant: 'outline'
        },
      ]
    },
    {
      label: "Overview",
      items: [
        { title: "Dashboard", icon: LayoutDashboard, url: "/dashboard" },
      ]
    },
    {
      label: "System",
      items: [
        { title: "Settings", icon: Settings, url: "/settings" },
      ]
    }
  ];

  const userInitials = user?.displayName
    ? user.displayName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
    : user?.email?.substring(0, 2).toUpperCase() || 'U';

  return (
    <Sidebar collapsible="icon" className="border-r bg-card print:hidden">
      <SidebarHeader className="p-4 border-b">
        <Logo className="text-lg" />
      </SidebarHeader>
      
      <SidebarContent>
        {menuGroups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel className="px-4 font-headline uppercase tracking-wider text-[10px] opacity-70">
              {group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      asChild 
                      isActive={pathname === item.url}
                      tooltip={item.title}
                      className="h-11 px-4"
                    >
                      <button onClick={() => handleNavigation(item.url)}>
                        <item.icon className={`mr-3 h-5 w-5 ${pathname === item.url ? 'text-primary' : 'text-muted-foreground'}`} />
                        <span className="font-medium">{item.title}</span>
                      </button>
                    </SidebarMenuButton>
                    {item.badge && state !== 'collapsed' && (
                      <SidebarMenuBadge className={
                        item.badgeVariant === 'destructive' ? 'bg-destructive text-destructive-foreground' : 
                        item.badgeVariant === 'outline' ? 'border-primary text-primary border' : 
                        'bg-primary text-primary-foreground'
                      }>
                        {item.badge}
                      </SidebarMenuBadge>
                    )}
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="p-2 border-t space-y-2">
        <div className={`flex items-center gap-3 px-2 py-3 rounded-lg bg-muted/30 transition-all ${state === 'collapsed' ? 'justify-center p-1' : ''}`}>
          <Avatar className="h-8 w-8 border border-primary/20">
            <AvatarImage src={user?.photoURL || ''} />
            <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-bold">
              {userInitials}
            </AvatarFallback>
          </Avatar>
          {state !== 'collapsed' && (
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold truncate">{user?.displayName || 'Business User'}</span>
              <span className="text-[10px] text-muted-foreground truncate">{user?.email}</span>
            </div>
          )}
        </div>

        <Button 
          variant="ghost" 
          className="w-full justify-start h-10 px-3 hover:bg-destructive/10 hover:text-destructive group-data-[collapsible=icon]:justify-center" 
          onClick={handleSignOut}
        >
          <LogOut className="mr-3 h-4 w-4 shrink-0" />
          <span className="text-xs font-medium group-data-[collapsible=icon]:hidden">Sign Out</span>
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}