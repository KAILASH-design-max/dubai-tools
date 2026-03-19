'use client';

import * as React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useUser, useAuth, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { signOut } from 'firebase/auth';
import { collection, query, where, orderBy, limit } from 'firebase/firestore';
import { Invoice, InventoryItem, LaborRecord } from '@/lib/types';
import {
  ReceiptText,
  Package,
  Users,
  Settings,
  LogOut,
  LayoutDashboard,
  PlusCircle,
  History,
  Clock,
  Target,
  ArrowDownRight,
  ArrowUpRight,
  Zap,
  Hammer,
  AlertCircle
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
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

const MONTHLY_GOAL = 500000; // Target: Rs 5,00,000

export function AppSidebar() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const { setOpenMobile, state } = useSidebar();

  // Data fetching
  const invoicesRef = useMemoFirebase(
    () => (firestore && user ? collection(firestore, `users/${user.uid}/invoices`) : null),
    [firestore, user]
  );
  
  const pendingInvoicesQuery = useMemoFirebase(
    () => (invoicesRef ? query(invoicesRef, where('status', 'in', ['Sent', 'Overdue'])) : null),
    [invoicesRef]
  );

  const recentInvoicesQuery = useMemoFirebase(
    () => (invoicesRef ? query(invoicesRef, orderBy('createdAt', 'desc'), limit(5)) : null),
    [invoicesRef]
  );

  const startOfMonth = React.useMemo(() => {
    const d = new Date();
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d.toISOString();
  }, []);

  const monthlyInvoicesQuery = useMemoFirebase(
    () => (invoicesRef ? query(invoicesRef, where('createdAt', '>=', startOfMonth)) : null),
    [invoicesRef, startOfMonth]
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
  const { data: recentInvoices } = useCollection<Invoice>(recentInvoicesQuery);
  const { data: monthlyInvoices } = useCollection<Invoice>(monthlyInvoicesQuery);
  const { data: inventoryItems } = useCollection<InventoryItem>(inventoryRef);
  const { data: pendingLabor } = useCollection<LaborRecord>(pendingLaborQuery);

  const lowStockCount = React.useMemo(() => {
    if (!inventoryItems) return 0;
    return inventoryItems.filter(item => 
      item.minStockLevel !== undefined && item.quantity <= item.minStockLevel
    ).length;
  }, [inventoryItems]);

  const monthlyRevenue = React.useMemo(() => {
    if (!monthlyInvoices) return 0;
    return monthlyInvoices.reduce((sum, inv) => sum + (inv.grandTotalAmount || 0), 0);
  }, [monthlyInvoices]);

  const totalOwedByCustomers = React.useMemo(() => {
    if (!pendingInvoices) return 0;
    return pendingInvoices.reduce((sum, inv) => sum + (inv.grandTotalAmount || 0), 0);
  }, [pendingInvoices]);

  const totalOwedToLabor = React.useMemo(() => {
    if (!pendingLabor) return 0;
    return pendingLabor.reduce((sum, rec) => sum + (rec.amount || 0), 0);
  }, [pendingLabor]);

  const progressPercentage = Math.min(100, (monthlyRevenue / MONTHLY_GOAL) * 100);

  if (isUserLoading || !user || user.isAnonymous || pathname === '/login' || pathname === '/signup') {
    return null;
  }

  const handleSignOut = async () => {
    if (!auth) return;
    try {
      await signOut(auth);
      setOpenMobile(false);
      router.push('/login');
      toast({ title: "Signed Out", description: "You have been successfully signed out." });
    } catch (e) {
      toast({ variant: 'destructive', title: 'Error', description: 'Sign out failed' });
    }
  };

  const handleNavigation = (url: string) => {
    router.push(url);
    setOpenMobile(false);
  };

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })
      .format(val).replace('₹', 'Rs ');

  const userInitials = user?.displayName
    ? user.displayName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
    : user?.email?.substring(0, 2).toUpperCase() || 'U';

  const menuGroups = [
    {
      label: "Invoicing",
      items: [
        { title: "New Invoice", icon: PlusCircle, url: "/" },
        { 
          title: "Invoice History", 
          icon: History, 
          url: "/invoices",
          badge: pendingInvoices?.length ? pendingInvoices.length : null,
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
          badge: pendingLabor?.length ? pendingLabor.length : null,
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

  const quickActions = [
    { title: "Add Stock", icon: Zap, url: "/inventory" },
    { title: "Log Work", icon: Hammer, url: "/labor" },
  ];

  return (
    <Sidebar collapsible="icon" className="border-r bg-card print:hidden">
      <SidebarHeader className="p-4 border-b space-y-4">
        <Logo className="text-lg" />
        
        {state !== 'collapsed' && (
          <div className="space-y-4">
            {/* Sales Target Card */}
            <div className="bg-primary/5 rounded-xl p-4 border border-primary/10 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-primary" />
                  <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Sales Target</span>
                </div>
                <span className="text-[10px] font-bold text-primary">{Math.round(progressPercentage)}%</span>
              </div>
              
              <div className="space-y-1">
                <div className="text-lg font-bold text-primary tracking-tight">
                  {formatCurrency(monthlyRevenue)}
                </div>
                <Progress value={progressPercentage} className="h-1.5" />
                <div className="flex justify-between items-center text-[9px] text-muted-foreground font-medium pt-1">
                  <span>Monthly Progress</span>
                  <span>Goal: {formatCurrency(MONTHLY_GOAL)}</span>
                </div>
              </div>
            </div>

            {/* Cash Flow Summary */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-green-50/50 dark:bg-green-950/10 p-2 rounded-lg border border-green-100 dark:border-green-900/30">
                <div className="flex items-center gap-1 text-[9px] font-bold text-green-600 uppercase">
                  <ArrowUpRight className="h-3 w-3" /> Receivable
                </div>
                <div className="text-[11px] font-bold truncate">{formatCurrency(totalOwedByCustomers)}</div>
              </div>
              <div className="bg-orange-50/50 dark:bg-orange-950/10 p-2 rounded-lg border border-orange-100 dark:border-orange-900/30">
                <div className="flex items-center gap-1 text-[9px] font-bold text-orange-600 uppercase">
                  <ArrowDownRight className="h-3 w-3" /> Payable
                </div>
                <div className="text-[11px] font-bold truncate">{formatCurrency(totalOwedToLabor)}</div>
              </div>
            </div>
          </div>
        )}
      </SidebarHeader>
      
      <SidebarContent>
        {/* Critical Alerts (Only shown when issues exist) */}
        {state !== 'collapsed' && (lowStockCount > 0 || (pendingInvoices?.length || 0) > 0) && (
           <SidebarGroup>
             <SidebarGroupLabel className="px-4 text-destructive font-bold flex items-center gap-2">
               <AlertCircle className="h-3 w-3" />
               Attention Required
             </SidebarGroupLabel>
             <SidebarGroupContent>
                <SidebarMenu>
                  {lowStockCount > 0 && (
                    <SidebarMenuItem>
                      <SidebarMenuButton className="text-destructive h-9" onClick={() => handleNavigation('/inventory')}>
                        <Zap className="h-4 w-4" />
                        <span className="text-xs font-bold">{lowStockCount} Items Low in Stock</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )}
                </SidebarMenu>
             </SidebarGroupContent>
           </SidebarGroup>
        )}

        {/* Quick Actions */}
        <SidebarGroup>
          <SidebarGroupLabel className="px-4 font-headline uppercase tracking-wider text-[10px] opacity-70">
            Quick Actions
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {quickActions.map((action) => (
                <SidebarMenuItem key={action.title}>
                  <SidebarMenuButton 
                    tooltip={action.title}
                    className="h-10 px-4"
                    onClick={() => handleNavigation(action.url)}
                  >
                    <action.icon className="mr-3 h-4 w-4 text-muted-foreground" />
                    <span className="text-xs font-medium">{action.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <Separator className="mx-4 w-auto opacity-50" />

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
                        <item.icon className={cn(
                          "mr-3 h-5 w-5 transition-colors",
                          pathname === item.url ? 'text-primary' : 'text-muted-foreground'
                        )} />
                        <span className="font-medium">{item.title}</span>
                      </button>
                    </SidebarMenuButton>
                    {item.badge && state !== 'collapsed' && (
                      <SidebarMenuBadge className={cn(
                        "rounded-full px-2 h-5 min-w-[20px] font-bold text-[10px]",
                        item.badgeVariant === 'destructive' ? 'bg-destructive text-destructive-foreground animate-pulse' : 
                        item.badgeVariant === 'outline' ? 'border-primary text-primary border bg-primary/5' : 
                        'bg-primary text-primary-foreground'
                      )}>
                        {item.badge}
                      </SidebarMenuBadge>
                    )}
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}

        {recentInvoices && recentInvoices.length > 0 && state !== 'collapsed' && (
          <SidebarGroup className="mt-2">
            <SidebarGroupLabel className="px-4 font-headline uppercase tracking-wider text-[10px] opacity-70 flex items-center gap-2">
              <Clock className="h-3 w-3" />
              Recent Activity
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {recentInvoices.map((inv) => (
                  <SidebarMenuItem key={inv.id}>
                    <SidebarMenuButton 
                      asChild 
                      className="h-12 px-4 group"
                      tooltip={inv.customerName}
                    >
                      <button onClick={() => handleNavigation('/invoices')}>
                        <div className="flex flex-col items-start min-w-0 flex-1">
                          <span className="text-xs font-bold truncate w-full">{inv.customerName}</span>
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
                            <Badge variant="outline" className={cn(
                              "px-1.5 py-0 text-[8px] h-3.5 border-none bg-muted/50",
                              inv.status === 'Paid' ? "text-green-600 bg-green-50" : "text-muted-foreground"
                            )}>
                              {inv.status}
                            </Badge>
                            {inv.invoiceNumber}
                          </span>
                        </div>
                      </button>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="p-2 border-t space-y-2">
        <div className={cn(
          "flex items-center gap-3 px-3 py-3 rounded-xl bg-muted/30 transition-all",
          state === 'collapsed' ? 'justify-center p-1' : ''
        )}>
          <Avatar className="h-8 w-8 border-2 border-primary/10">
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
