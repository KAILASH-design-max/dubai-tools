"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { MainHeader } from "@/components/main-header";
import { Button } from "@/components/ui/button";
import { User, Building2, Users, LogOut, Settings2, Download, Database, ShieldCheck } from "lucide-react";
import { useUser, useAuth } from "@/firebase";
import { Skeleton } from "@/components/ui/skeleton";
import { CompanyProfileForm } from "@/components/settings/company-profile-form";
import { UserProfileForm } from "@/components/settings/user-profile-form";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { CustomerList } from "@/components/settings/customer-list";
import { PreferencesForm } from "@/components/settings/preferences-form";
import { DataManagement } from "@/components/settings/data-management";
import { SecuritySettings } from "@/components/settings/security-settings";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { signOut } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";

export default function SettingsPage() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (!isUserLoading && (!user || user.isAnonymous)) {
      router.push("/login");
    }
  }, [user, isUserLoading, router]);

  const handleSignOut = async () => {
    if (!auth) return;
    try {
      await signOut(auth);
      toast({
        title: "Signed Out",
        description: "You have been successfully signed out.",
      });
      router.push("/login");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to sign out.",
      });
    }
  };

  if (isUserLoading || !user || user.isAnonymous) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <div className="max-w-2xl w-full mx-auto space-y-8">
          <Skeleton className="h-16 w-48 mx-auto" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <MainHeader />
      <main className="container mx-auto p-2 sm:p-4 md:p-6">
        <div className="max-w-3xl mx-auto space-y-8 pb-12">
            <h1 className="text-3xl font-bold font-headline">Settings</h1>
            
            <Tabs defaultValue="company" className="w-full">
              <TabsList className="grid w-full grid-cols-3 md:grid-cols-6 h-auto p-1 bg-muted/50 gap-1">
                <TabsTrigger value="company" className="py-2 flex flex-col items-center gap-1">
                  <Building2 className="h-4 w-4" />
                  <span className="text-[10px] sm:text-xs">Business</span>
                </TabsTrigger>
                <TabsTrigger value="profile" className="py-2 flex flex-col items-center gap-1">
                  <User className="h-4 w-4" />
                  <span className="text-[10px] sm:text-xs">Account</span>
                </TabsTrigger>
                <TabsTrigger value="customers" className="py-2 flex flex-col items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span className="text-[10px] sm:text-xs">Clients</span>
                </TabsTrigger>
                <TabsTrigger value="preferences" className="py-2 flex flex-col items-center gap-1">
                  <Settings2 className="h-4 w-4" />
                  <span className="text-[10px] sm:text-xs">Defaults</span>
                </TabsTrigger>
                <TabsTrigger value="security" className="py-2 flex flex-col items-center gap-1">
                  <ShieldCheck className="h-4 w-4" />
                  <span className="text-[10px] sm:text-xs">Security</span>
                </TabsTrigger>
                <TabsTrigger value="data" className="py-2 flex flex-col items-center gap-1">
                  <Database className="h-4 w-4" />
                  <span className="text-[10px] sm:text-xs">Data</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="company" className="mt-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Company Profile</CardTitle>
                        <CardDescription>Update your company's information and default invoice terms.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <CompanyProfileForm userId={user.uid} />
                    </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="profile" className="mt-6">
                <Card>
                    <CardHeader>
                        <CardTitle>User Profile</CardTitle>
                        <CardDescription>Manage your personal account details.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <UserProfileForm user={user} />
                        <Separator />
                        <div className="pt-2">
                          <h3 className="text-sm font-medium mb-4 text-destructive">Danger Zone</h3>
                          <Button variant="destructive" onClick={handleSignOut} className="w-full sm:w-auto">
                            <LogOut className="mr-2 h-4 w-4" />
                            Sign Out of Account
                          </Button>
                        </div>
                    </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="customers" className="mt-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Customers</CardTitle>
                        <CardDescription>Manage your customers. Add, edit, or remove customer records.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <CustomerList userId={user.uid} />
                    </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="preferences" className="mt-6">
                <Card>
                    <CardHeader>
                        <CardTitle>App Preferences</CardTitle>
                        <CardDescription>Configure global defaults for tax, currency, and invoicing.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <PreferencesForm userId={user.uid} />
                    </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="security" className="mt-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Security & Access</CardTitle>
                        <CardDescription>Manage your password and account protection.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <SecuritySettings />
                    </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="data" className="mt-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Data Management</CardTitle>
                        <CardDescription>Export your business records for backup or accounting.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <DataManagement userId={user.uid} />
                    </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
        </div>
      </main>
      <footer className="container mx-auto py-6 px-4 text-center text-sm text-muted-foreground md:px-6">
        <p>&copy; {new Date().getFullYear()} Dubai Tools. All rights reserved.</p>
      </footer>
    </div>
  );
}
