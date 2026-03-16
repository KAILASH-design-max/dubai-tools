
'use client';

import * as React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useUser, useAuth } from '@/firebase';
import { signOut } from 'firebase/auth';
import {
  FileText,
  ReceiptText,
  Package,
  Users,
  Settings,
  LogOut,
  LayoutDashboard,
  PlusCircle,
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
  useSidebar,
} from '@/components/ui/sidebar';
import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export function AppSidebar() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const { setOpenMobile } = useSidebar();

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
      label: "Overview",
      items: [
        { title: "Dashboard", icon: LayoutDashboard, url: "/dashboard" },
      ]
    },
    {
      label: "Invoicing",
      items: [
        { title: "New Invoice", icon: PlusCircle, url: "/" },
        { title: "Invoice History", icon: ReceiptText, url: "/invoices" },
      ]
    },
    {
      label: "Management",
      items: [
        { title: "Inventory", icon: Package, url: "/inventory" },
        { title: "Labor Management", icon: Users, url: "/labor" },
      ]
    },
    {
      label: "System",
      items: [
        { title: "Settings", icon: Settings, url: "/settings" },
      ]
    }
  ];

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
                        <item.icon className="mr-3 h-5 w-5 text-primary" />
                        <span className="font-medium">{item.title}</span>
                      </button>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="p-4 border-t">
        <Button 
          variant="destructive" 
          className="w-full justify-start h-10 px-2 group-data-[collapsible=icon]:justify-center" 
          onClick={handleSignOut}
        >
          <LogOut className="mr-3 h-4 w-4 shrink-0" />
          <span className="text-sm group-data-[collapsible=icon]:hidden">Sign Out</span>
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
