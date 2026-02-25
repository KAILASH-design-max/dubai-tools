'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useUser, useAuth, useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { initiateAnonymousSignIn } from '@/firebase/non-blocking-login';
import { collection, query, where } from 'firebase/firestore';
import { Invoice } from '@/lib/types';
import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';

export default function InvoicesPage() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();

  useEffect(() => {
    if (auth && !user && !isUserLoading) {
      initiateAnonymousSignIn(auth);
    }
  }, [auth, user, isUserLoading]);

  const invoicesCollectionRef = useMemoFirebase(
    () => (firestore && user ? collection(firestore, `users/${user.uid}/invoices`) : null),
    [firestore, user]
  );
  
  // Query to exclude the draft 'main' invoice
  const invoicesQuery = useMemoFirebase(
      () => invoicesCollectionRef ? query(invoicesCollectionRef, where('__name__', '!=', 'main')) : null,
      [invoicesCollectionRef]
  );

  const { data: invoices, isLoading: isInvoicesLoading } = useCollection<Invoice>(invoicesQuery);

  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount).replace('₹', 'Rs ');
  
  const formatDate = (dateString: string) => {
    try {
      // Adding a time to make sure parsing is consistent
      return format(new Date(`${dateString}T00:00:00`), 'PP');
    } catch (e) {
      return dateString; // fallback to original string
    }
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
        <div className="max-w-4xl mx-auto space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle>Invoice History</CardTitle>
                    <CardDescription>Here is a list of all your saved invoices.</CardDescription>
                </CardHeader>
                <CardContent>
                    {(isUserLoading || isInvoicesLoading) && (
                        <div className="space-y-2 p-4">
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-12 w-full" />
                        </div>
                    )}
                    {user && !isInvoicesLoading && (
                      invoices && invoices.length > 0 ? (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Invoice #</TableHead>
                              <TableHead>Customer</TableHead>
                              <TableHead>Date</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead className="text-right">Amount</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {invoices.sort((a, b) => new Date(b.invoiceDate).getTime() - new Date(a.invoiceDate).getTime()).map(invoice => (
                              <TableRow key={invoice.id}>
                                <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                                <TableCell>{invoice.customerName}</TableCell>
                                <TableCell>{formatDate(invoice.invoiceDate)}</TableCell>
                                <TableCell><Badge variant={invoice.status === 'Paid' ? 'default' : 'secondary'}>{invoice.status}</Badge></TableCell>
                                <TableCell className="text-right">{formatCurrency(invoice.grandTotalAmount)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      ) : (
                        <p className="text-center text-muted-foreground py-8">You have no saved invoices.</p>
                      )
                    )}
                    {!user && !isUserLoading && (
                        <p className="text-center text-muted-foreground py-8">Please sign in to view invoice history.</p>
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
