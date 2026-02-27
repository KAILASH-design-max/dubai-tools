'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useUser, useAuth, useCollection, useFirestore, useMemoFirebase, deleteDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase';
import { initiateAnonymousSignIn } from '@/firebase/non-blocking-login';
import { collection, query, where, doc } from 'firebase/firestore';
import { Invoice } from '@/lib/types';
import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Search, Trash2, FileText, IndianRupee, Clock, CheckCircle2, Download, Filter, MoreHorizontal, TrendingUp, Check, XCircle, Send } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { format, parseISO, startOfMonth } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from "recharts";

export default function InvoicesPage() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    if (auth && !user && !isUserLoading) {
      initiateAnonymousSignIn(auth);
    }
  }, [auth, user, isUserLoading]);

  const invoicesCollectionRef = useMemoFirebase(
    () => (firestore && user ? collection(firestore, `users/${user.uid}/invoices`) : null),
    [firestore, user]
  );
  
  const invoicesQuery = useMemoFirebase(
      () => invoicesCollectionRef ? query(invoicesCollectionRef, where('__name__', '!=', 'main')) : null,
      [invoicesCollectionRef]
  );

  const { data: invoices, isLoading: isInvoicesLoading } = useCollection<Invoice>(invoicesQuery);

  const filteredInvoices = useMemo(() => {
    if (!invoices) return [];
    return invoices
      .filter(inv => {
        const matchesSearch = 
          inv.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          inv.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesStatus = statusFilter === 'all' || 
          (statusFilter === 'pending' && (inv.status === 'Sent' || inv.status === 'Draft' || inv.status === 'Overdue')) ||
          inv.status.toLowerCase() === statusFilter.toLowerCase();

        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => new Date(b.invoiceDate).getTime() - new Date(a.invoiceDate).getTime());
  }, [invoices, searchTerm, statusFilter]);

  const stats = useMemo(() => {
    const dataToSummarize = statusFilter === 'all' ? (invoices || []) : filteredInvoices;
    return dataToSummarize.reduce((acc, inv) => {
      acc.total += inv.grandTotalAmount;
      if (inv.status === 'Paid') {
        acc.paid += inv.grandTotalAmount;
      } else if (inv.status === 'Sent' || inv.status === 'Draft' || inv.status === 'Overdue') {
        acc.pending += inv.grandTotalAmount;
      }
      return acc;
    }, { total: 0, paid: 0, pending: 0 });
  }, [invoices, filteredInvoices, statusFilter]);

  // Chart Data Preparation
  const chartData = useMemo(() => {
    if (!invoices) return [];
    
    const monthlyData: Record<string, number> = {};
    
    invoices.forEach(inv => {
      if (inv.status === 'Paid' || inv.status === 'Sent') {
        const monthKey = format(parseISO(inv.invoiceDate), 'MMM yyyy');
        monthlyData[monthKey] = (monthlyData[monthKey] || 0) + inv.grandTotalAmount;
      }
    });

    return Object.entries(monthlyData)
      .map(([month, revenue]) => ({ month, revenue }))
      .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime())
      .slice(-6); // Last 6 months
  }, [invoices]);

  const chartConfig = {
    revenue: {
      label: "Revenue",
      color: "hsl(var(--primary))",
    },
  } satisfies ChartConfig;

  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-IN', { 
    style: 'currency', 
    currency: 'INR', 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  }).format(amount).replace('₹', 'Rs ');
  
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(`${dateString}T00:00:00`), 'PP');
    } catch (e) {
      return dateString;
    }
  }

  const handleDelete = (id: string, invoiceNumber: string) => {
    if (!firestore || !user) return;
    const invoiceDocRef = doc(firestore, `users/${user.uid}/invoices/${id}`);
    deleteDocumentNonBlocking(invoiceDocRef);
    toast({
      title: "Invoice Deleted",
      description: `Invoice ${invoiceNumber} has been removed.`,
    });
  };

  const handleUpdateStatus = (id: string, newStatus: Invoice['status']) => {
    if (!firestore || !user) return;
    const invoiceDocRef = doc(firestore, `users/${user.uid}/invoices/${id}`);
    updateDocumentNonBlocking(invoiceDocRef, { status: newStatus, updatedAt: new Date().toISOString() });
    toast({
      title: "Status Updated",
      description: `Invoice status changed to ${newStatus}.`,
    });
  };

  const exportToCSV = () => {
    if (!filteredInvoices.length) return;
    
    const headers = ['Invoice #', 'Customer', 'Date', 'Status', 'Subtotal', 'Tax', 'Grand Total'];
    const rows = filteredInvoices.map(inv => [
      inv.invoiceNumber,
      inv.customerName,
      inv.invoiceDate,
      inv.status,
      inv.subtotalAmount.toFixed(2),
      inv.totalTaxAmount.toFixed(2),
      inv.grandTotalAmount.toFixed(2)
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `invoices_export_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Export Complete",
      description: "Your invoices have been exported to CSV.",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Paid':
        return <Badge className="bg-green-600 hover:bg-green-700">{status}</Badge>;
      case 'Sent':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-none">{status}</Badge>;
      case 'Draft':
        return <Badge variant="outline">{status}</Badge>;
      case 'Overdue':
        return <Badge variant="destructive">{status}</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-10 border-b bg-card/80 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
          <Logo />
          <Link href="/">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Editor
            </Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto p-4 md:p-6 lg:p-8">
        <div className="max-w-6xl mx-auto space-y-8">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold font-headline">Invoice Dashboard</h2>
              <p className="text-muted-foreground">Monitor your business performance and manage records.</p>
            </div>
            <Button onClick={exportToCSV} variant="outline" disabled={!filteredInvoices.length}>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Summary Stats */}
            <div className="lg:col-span-1 space-y-4">
              <Card>
                <CardContent className="pt-6 flex items-center gap-4">
                  <div className="p-3 bg-primary/10 rounded-full text-primary">
                    <IndianRupee className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{statusFilter === 'all' ? 'Total Volume' : 'Current View Total'}</p>
                    <p className="text-2xl font-bold font-headline">{formatCurrency(stats.total)}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 flex items-center gap-4">
                  <div className="p-3 bg-green-100 rounded-full text-green-600">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Paid</p>
                    <p className="text-2xl font-bold font-headline text-green-600">{formatCurrency(stats.paid)}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 flex items-center gap-4">
                  <div className="p-3 bg-orange-100 rounded-full text-orange-600">
                    <Clock className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Pending Payment</p>
                    <p className="text-2xl font-bold font-headline text-orange-600">{formatCurrency(stats.pending)}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Revenue Chart */}
            <Card className="lg:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <div className="space-y-1">
                  <CardTitle className="text-xl font-bold flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    Revenue Insights
                  </CardTitle>
                  <CardDescription>Monthly billing volume (last 6 months)</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="pb-4">
                <div className="h-[200px] w-full">
                  {chartData.length > 0 ? (
                    <ChartContainer config={chartConfig} className="h-full w-full">
                      <BarChart data={chartData}>
                        <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.3} />
                        <XAxis
                          dataKey="month"
                          tickLine={false}
                          tickMargin={10}
                          axisLine={false}
                          fontSize={12}
                        />
                        <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                        <Bar
                          dataKey="revenue"
                          fill="var(--color-revenue)"
                          radius={[4, 4, 0, 0]}
                          barSize={40}
                        />
                      </BarChart>
                    </ChartContainer>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-sm">
                      <TrendingUp className="h-8 w-8 mb-2 opacity-20" />
                      <p>Not enough data for insights yet.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <Tabs defaultValue="all" className="w-full md:w-auto" onValueChange={setStatusFilter}>
                  <TabsList>
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="paid">Paid</TabsTrigger>
                    <TabsTrigger value="pending">Pending</TabsTrigger>
                    <TabsTrigger value="draft">Draft</TabsTrigger>
                  </TabsList>
                </Tabs>
                <div className="relative w-full md:w-72">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search customer or ID..." 
                    className="pl-9"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {(isUserLoading || isInvoicesLoading) && (
                <div className="space-y-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              )}

              {user && !isInvoicesLoading && (
                filteredInvoices.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Invoice #</TableHead>
                          <TableHead>Customer</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredInvoices.map(invoice => (
                          <TableRow key={invoice.id}>
                            <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                            <TableCell>{invoice.customerName}</TableCell>
                            <TableCell>{formatDate(invoice.invoiceDate)}</TableCell>
                            <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                            <TableCell className="text-right font-medium">{formatCurrency(invoice.grandTotalAmount)}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    {invoice.status !== 'Paid' && (
                                      <DropdownMenuItem onClick={() => handleUpdateStatus(invoice.id, 'Paid')}>
                                        <Check className="mr-2 h-4 w-4 text-green-600" />
                                        Mark as Paid
                                      </DropdownMenuItem>
                                    )}
                                    {invoice.status === 'Draft' && (
                                      <DropdownMenuItem onClick={() => handleUpdateStatus(invoice.id, 'Sent')}>
                                        <Send className="mr-2 h-4 w-4 text-blue-600" />
                                        Mark as Sent
                                      </DropdownMenuItem>
                                    )}
                                    {invoice.status !== 'Cancelled' && (
                                      <DropdownMenuItem onClick={() => handleUpdateStatus(invoice.id, 'Cancelled')}>
                                        <XCircle className="mr-2 h-4 w-4 text-muted-foreground" />
                                        Cancel Invoice
                                      </DropdownMenuItem>
                                    )}
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => window.print()}>
                                      <FileText className="mr-2 h-4 w-4" />
                                      Print Copy
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <div className="flex w-full items-center px-2 py-1.5 text-sm text-destructive cursor-pointer hover:bg-destructive/10 rounded-sm">
                                          <Trash2 className="mr-2 h-4 w-4" />
                                          Delete Record
                                        </div>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                          <AlertDialogDescription>
                                            This will permanently delete invoice <strong>{invoice.invoiceNumber}</strong>. This action cannot be undone.
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                                          <AlertDialogAction onClick={() => handleDelete(invoice.id, invoice.invoiceNumber)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                            Delete Invoice
                                          </AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-12 space-y-4">
                    <FileText className="h-12 w-12 mx-auto text-muted-foreground/50" />
                    <p className="text-muted-foreground">
                      {searchTerm ? `No invoices found matching "${searchTerm}"` : "No invoices found for this category."}
                    </p>
                    {!searchTerm && statusFilter === 'all' && (
                      <Link href="/">
                        <Button variant="outline">Create Your First Invoice</Button>
                      </Link>
                    )}
                  </div>
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
