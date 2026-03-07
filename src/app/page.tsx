"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { InvoiceForm } from "@/components/invoice/invoice-form";
import { MainHeader } from "@/components/main-header";
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
      <MainHeader />
      <main className="container mx-auto p-2 sm:p-4 md:p-6">
        <InvoiceForm userId={user.uid} />
      </main>
      <footer className="container mx-auto py-6 px-4 text-center text-sm text-muted-foreground md:px-6 print:hidden">
        <p>&copy; {new Date().getFullYear()} Dubai Tools. All rights reserved.</p>
      </footer>
    </div>
  );
}
