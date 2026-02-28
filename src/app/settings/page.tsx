
"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { ArrowLeft, User, Building2, Users } from "lucide-react";
import { useUser } from "@/firebase";
import { Skeleton } from "@/components/ui/skeleton";
import { CompanyProfileForm } from "@/components/settings/company-profile-form";
import { UserProfileForm } from "@/components/settings/user-profile-form";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { CustomerList } from "@/components/settings/customer-list";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function SettingsPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && (!user || user.isAnonymous)) {
      router.push("/login");
    }
  }, [user, isUserLoading, router]);

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
      <header className="sticky top-0 z-10 border-b bg-card/80 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
          <Logo />
          <Link href="/">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Invoice
            </Button>
          </Link>
        </div>
      </header>
      <main className="container mx-auto p-2 sm:p-4 md:p-6">
        <div className="max-w-2xl mx-auto space-y-8">
            <h1 className="text-3xl font-bold font-headline">Settings</h1>
            
            <Tabs defaultValue="company" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="company" className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Business
                </TabsTrigger>
                <TabsTrigger value="profile" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Account
                </TabsTrigger>
                <TabsTrigger value="customers" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Customers
                </TabsTrigger>
              </TabsList>

              <TabsContent value="company" className="mt-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Company Profile</CardTitle>
                        <CardDescription>Update your company's information. This will be reflected on your invoices.</CardDescription>
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
                    <CardContent>
                        <UserProfileForm user={user} />
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
            </Tabs>
        </div>
      </main>
      <footer className="container mx-auto py-6 px-4 text-center text-sm text-muted-foreground md:px-6">
        <p>&copy; {new Date().getFullYear()} Dubai Tools. All rights reserved.</p>
      </footer>
    </div>
  );
}
