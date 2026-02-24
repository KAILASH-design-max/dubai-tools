"use client";

import { useEffect } from "react";
import { InvoiceForm } from "@/components/invoice/invoice-form";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Settings, Share2 } from "lucide-react";
import { useUser, useAuth } from "@/firebase";
import { initiateAnonymousSignIn } from "@/firebase/non-blocking-login";
import { Skeleton } from "@/components/ui/skeleton";

export default function Home() {
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
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon">
              <Share2 className="h-5 w-5" />
              <span className="sr-only">Share</span>
            </Button>
            <Button variant="ghost" size="icon">
              <Settings className="h-5 w-5" />
              <span className="sr-only">Settings</span>
            </Button>
          </div>
        </div>
      </header>
      <main className="container mx-auto p-4 md:p-6 lg:p-8">
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
          !isUserLoading && <p>Please sign in to continue.</p>
        )}
      </main>
      <footer className="container mx-auto py-6 px-4 text-center text-sm text-muted-foreground md:px-6">
        <p>&copy; {new Date().getFullYear()} Dubai Tools. All rights reserved.</p>
      </footer>
    </div>
  );
}
