"use client";

import { useEffect } from "react";
import Link from "next/link";
import { InvoiceForm } from "@/components/invoice/invoice-form";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Settings, Share2, History, LogIn, UserPlus, LogOut } from "lucide-react";
import { useUser, useAuth } from "@/firebase";
import { initiateAnonymousSignIn } from "@/firebase/non-blocking-login";
import { Skeleton } from "@/components/ui/skeleton";
import { signOut } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (auth && !user && !isUserLoading) {
      initiateAnonymousSignIn(auth);
    }
  }, [auth, user, isUserLoading]);

  const handleSignOut = async () => {
    if (!auth) return;
    try {
      await signOut(auth);
      toast({
        title: "Signed Out",
        description: "You have been successfully signed out.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to sign out.",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-10 border-b bg-card/80 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
          <Logo />
          <div className="flex items-center gap-2">
            {user?.isAnonymous && (
              <div className="hidden sm:flex items-center gap-2 mr-2">
                <Link href="/login">
                  <Button variant="outline" size="sm">
                    <LogIn className="mr-2 h-4 w-4" />
                    Log In
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button size="sm">
                    <UserPlus className="mr-2 h-4 w-4" />
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}
            
            {!user?.isAnonymous && user && (
               <Button variant="ghost" size="icon" title="Sign Out" onClick={handleSignOut}>
                <LogOut className="h-5 w-5" />
                <span className="sr-only">Sign Out</span>
              </Button>
            )}

            <Button variant="ghost" size="icon">
              <Share2 className="h-5 w-5" />
              <span className="sr-only">Share</span>
            </Button>
            <Link href="/invoices">
              <Button variant="ghost" size="icon" title="Invoice History">
                <History className="h-5 w-5" />
                <span className="sr-only">Invoice History</span>
              </Button>
            </Link>
            <Link href="/settings">
              <Button variant="ghost" size="icon" title="Settings">
                <Settings className="h-5 w-5" />
                <span className="sr-only">Settings</span>
              </Button>
            </Link>
          </div>
        </div>
      </header>
      <main className="container mx-auto p-2 sm:p-4 md:p-6">
      {isUserLoading && (
          <div className="max-w-4xl mx-auto space-y-8">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        )}
        {user ? (
          <InvoiceForm userId={user.uid} />
        ) : (
          !isUserLoading && <p className="text-center py-12 text-muted-foreground">Please sign in to continue.</p>
        )}
      </main>
      <footer className="container mx-auto py-6 px-4 text-center text-sm text-muted-foreground md:px-6">
        <p>&copy; {new Date().getFullYear()} Dubai Tools. All rights reserved.</p>
      </footer>
    </div>
  );
}
