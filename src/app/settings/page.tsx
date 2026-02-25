"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useUser, useAuth } from "@/firebase";
import { initiateAnonymousSignIn } from "@/firebase/non-blocking-login";
import { Skeleton } from "@/components/ui/skeleton";
import { CompanyProfileForm } from "@/components/settings/company-profile-form";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { CustomerList } from "@/components/settings/customer-list";


export default function SettingsPage() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();

  useEffect(() => {
    if (auth && !user && !isUserLoading) {
      initiateAnonymousSignIn(auth);
    }
  }, [auth, user, isUserLoading]);


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
            <Card>
                <CardHeader>
                    <CardTitle>Company Profile</CardTitle>
                    <CardDescription>Update your company's information. This will be reflected on your invoices.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isUserLoading && (
                        <div className="space-y-4">
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                    )}
                    {user ? (
                        <CompanyProfileForm userId={user.uid} />
                    ) : (
                        !isUserLoading && <p>Please sign in to view settings.</p>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Customers</CardTitle>
                    <CardDescription>Manage your customers. Add, edit, or remove customer records.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isUserLoading && (
                        <div className="space-y-4">
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-12 w-full" />
                        </div>
                    )}
                    {user ? (
                        <CustomerList userId={user.uid} />
                    ) : (
                        !isUserLoading && <p>Please sign in to view settings.</p>
                    )}
                </CardContent>
            </Card>
        </div>
      </main>
      <footer className="container mx-auto py-6 px-4 text-center text-sm text-muted-foreground md:px-6">
        <p>&copy; {new Date().getFullYear()} Dubai Tools. All rights reserved.</p>
      </footer>
    </div>
  );
}
