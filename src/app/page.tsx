
"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { InvoiceForm } from "@/components/invoice/invoice-form";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Settings, Share2, ReceiptText, Package, Users } from "lucide-react";
import { useUser } from "@/firebase";
import { Skeleton } from "@/components/ui/skeleton";

export default function Home() {
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
        <div className="max-w-4xl w-full mx-auto space-y-8">
          <Skeleton className="h-16 w-48 mx-auto" />
          <Skeleton className="h-32 w-full" />
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
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon">
              <Share2 className="h-5 w-5" />
              <span className="sr-only">Share</span>
            </Button>
            <Link href="/labor">
              <Button variant="ghost" size="icon" title="Labor Management">
                <Users className="h-5 w-5" />
                <span className="sr-only">Labor</span>
              </Button>
            </Link>
            <Link href="/inventory">
              <Button variant="ghost" size="icon" title="Inventory Management">
                <Package className="h-5 w-5" />
                <span className="sr-only">Inventory</span>
              </Button>
            </Link>
            <Link href="/invoices">
              <Button variant="ghost" size="icon" title="Invoice History">
                <ReceiptText className="h-5 w-5" />
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
        <InvoiceForm userId={user.uid} />
      </main>
      <footer className="container mx-auto py-6 px-4 text-center text-sm text-muted-foreground md:px-6">
        <p>&copy; {new Date().getFullYear()} Dubai Tools. All rights reserved.</p>
      </footer>
    </div>
  );
}
