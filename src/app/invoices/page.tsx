'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useCollection, useFirestore, useMemoFirebase, deleteDocumentNonBlocking, useCompanyProfile } from '@/firebase';
import { collection, query, where, doc } from 'firebase/firestore';
import { Invoice, InvoiceLineItem } from '@/lib/types';
import { MainHeader } from '@/components/main-header';
import { Button } from '@/components/ui/button';
import { Search, Trash2, MoreHorizontal, Printer, Receipt, Eye, Download } from 'lucide-react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Image from 'next/image';
import { PlugZap } from 'lucide-react';

function InvoiceDetailModal({ invoice, userId, isOpen, onOpenChange }: { invoice: Invoice | null, userId: string, isOpen: boolean, onOpenChange: (open: boolean) => void }) {
  const firestore = useFirestore();
  const [printMode, setPrintMode] = useState<'a4' | 'receipt'>('a4');
  const { data: companyProfile } = useCompanyProfile(userId);

  const lineItemsRef = useMemoFirebase(
    () => (firestore && userId && invoice ? collection(firestore, `users/${userId}/invoices/${invoice.id}/lineItems`) : null),
    [firestore, userId, invoice?.id]
  );
  const { data: lineItems, isLoading } = useCollection<InvoiceLineItem>(lineItemsRef);

  if (!invoice) return null;

  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-IN', { 
    style: 'currency', 
    currency: 'INR'
  }).format(amount).replace('₹', 'Rs ');

  const handlePrint = (mode: 'a4' | 'receipt') => {
    setPrintMode(mode);
    setTimeout(() => window.print(), 100);
  };

  const activeProfile = companyProfile || { 
    name: 'DUBAI TOOLS', 
    addressLine1: 'Shivdhara', 
    phoneNumbers: ['9268863031', '7280944150'], 
    email: 'dubaitools2026@gmail.com', 
    gstRegistrationNumber: 'Qw1234766666s' 
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className={`max-w-3xl max-h-[90vh] overflow-y-auto ${printMode === 'a4' ? 'print-a4' : 'print-receipt'}`}>
        <style>{`
          @media screen { .receipt-view-modal { display: none; } }
          @media print {
            body * { visibility: hidden; }
            .print-a4 .invoice-detail-print, .print-a4 .invoice-detail-print * { visibility: visible; }
            .print-receipt .receipt-view-modal, .print-receipt .receipt-view-modal * { visibility: visible; }
            
            .invoice-detail-print {
              position: absolute; left: 0; top: 0; width: 100%; border: none !important; padding: 5mm !important; background: white !important; font-size: 8pt;
            }
            .receipt-view-modal {
              position: absolute; left: 0; top: 0; width: 80mm; padding: 2mm; font-family: monospace; font-size: 9pt; display: block !important; background: white !important;
            }
            thead { display: table-header-group !important; }
          }
        `}</style>
        
        <div className="invoice-detail-print space-y-6 py-4">
           <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <PlugZap className="h-8 w-8 text-primary" />
                <div>
                  <DialogTitle className="text-2xl font-headline text-primary">Invoice Details</DialogTitle>
                  <DialogDescription>Reference: {invoice.invoiceNumber}</DialogDescription>
                </div>
              </div>
              <Badge className={invoice.status === 'Paid' ? 'bg-green-600' : ''}>{invoice.status}</Badge>
           </div>
           
           <div className="grid grid-cols-2 gap-8 text-sm">
             <div>
               <p className="text-muted-foreground mb-1 uppercase text-[10px] font-bold tracking-wider">Bill To</p>
               <div className="border rounded-md p-3 space-y-1 bg-muted/5 print:p-0 print:border-none">
                 <p className="font-bold text-lg leading-tight">{invoice.customerName}</p>
                 {invoice.customerPhone && <p className="text-muted-foreground text-xs">Ph: {invoice.customerPhone}</p>}
               </div>
             </div>
             <div className="text-right">
               <p className="text-muted-foreground mb-1 uppercase text-[10px] font-bold tracking-wider">Date Issued</p>
               <p className="font-medium">{format(new Date(`${invoice.invoiceDate}T00:00:00`), 'PP')}</p>
             </div>
           </div>

           <div className="rounded-md border overflow-hidden">
             <Table>
               <TableHeader className="bg-muted/50">
                 <TableRow>
                   <TableHead>Item</TableHead>
                   <TableHead>Description</TableHead>
                   <TableHead className="text-right">Qty</TableHead>
                   <TableHead className="text-right">Total</TableHead>
                 </TableRow>
               </TableHeader>
               <TableBody>
                 {isLoading ? (
                   <TableRow><TableCell colSpan={4} className="text-center py-12">Loading...</TableCell></TableRow>
                 ) : lineItems?.map((item, idx) => {
                   const qty = parseFloat(item.quantity) || 1;
                   const total = (item.description === 'Labor cost' ? item.rate : qty * item.rate) * (1 + item.tax / 100);
                   return (
                     <TableRow key={item.id}>
                       <TableCell className="text-muted-foreground text-xs">{idx + 1}</TableCell>
                       <TableCell className="font-medium">{item.description}</TableCell>
                       <TableCell className="text-right">{item.quantity}</TableCell>
                       <TableCell className="text-right font-bold">{total.toFixed(2)}</TableCell>
                     </TableRow>
                   )
                 })}
               </TableBody>
             </Table>
           </div>

           <div className="flex justify-between items-end gap-8 pt-4">
             <div className="signature-area flex flex-col items-start gap-1">
               <div className="relative h-12 w-24">
                 <Image src="/signature.jpeg" alt="Signature" width={100} height={50} className="object-contain" />
               </div>
               <div className="w-40 border-t border-dashed pt-1">
                 <p className="text-[10px] text-muted-foreground">Authorized Signature</p>
               </div>
             </div>
             <div className="w-full md:w-1/2 space-y-2 text-right">
               <div className="flex justify-between px-2"><span>Subtotal</span><span>{formatCurrency(invoice.subtotalAmount)}</span></div>
               <div className="flex justify-between px-2"><span>Tax</span><span>{formatCurrency(invoice.totalTaxAmount)}</span></div>
               <Separator />
               <div className="flex justify-between bg-primary/5 p-4 rounded-lg border border-primary/20">
                 <span className="font-headline font-bold text-primary">Grand Total</span>
                 <span className="font-headline font-bold text-2xl text-primary">{formatCurrency(invoice.grandTotalAmount)}</span>
               </div>
             </div>
           </div>
        </div>

        {/* 80mm Receipt View for Modal */}
        <div className="receipt-view-modal hidden">
          <div className="text-center space-y-1 mb-2">
            <div className="flex justify-center mb-1"><PlugZap className="h-6 w-6 text-primary" /></div>
            <h2 className="font-bold text-lg uppercase">{activeProfile.name}</h2>
            <p className="text-[8pt]">{activeProfile.addressLine1}</p>
            <p className="text-[8pt]">Ph: {activeProfile.phoneNumbers.join(', ')}</p>
            {activeProfile.gstRegistrationNumber && <p className="text-[8pt]">GST: {activeProfile.gstRegistrationNumber}</p>}
          </div>
          <Separator className="border-dashed my-2" />
          <div className="text-[8pt] space-y-1 mb-2">
            <div className="flex justify-between"><span>Inv: {invoice.invoiceNumber}</span><span>{invoice.invoiceDate}</span></div>
            <div className="font-bold">Bill To: {invoice.customerName}</div>
            {invoice.customerPhone && <div>Ph: {invoice.customerPhone}</div>}
          </div>
          <Separator className="border-dashed my-2" />
          <table className="w-full text-[8pt]">
            <thead>
              <tr className="border-b border-dashed">
                <th className="text-left py-1">Item</th>
                <th className="text-right py-1">Qty</th>
                <th className="text-right py-1">Total</th>
              </tr>
            </thead>
            <tbody>
              {lineItems?.map((item, idx) => {
                const qty = parseFloat(item.quantity) || 1;
                const total = (item.description === 'Labor cost' ? item.rate : qty * item.rate) * (1 + item.tax / 100);
                return (
                  <tr key={item.id} className="border-b border-dashed border-gray-50">
                    <td className="py-1">{idx + 1}. {item.description}</td>
                    <td className="text-right py-1">{item.quantity}</td>
                    <td className="text-right py-1">{total.toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="mt-2 space-y-1 text-[8pt]">
            <div className="flex justify-between border-t border-dashed pt-2">
              <span>Subtotal:</span><span>{formatCurrency(invoice.subtotalAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span>Tax:</span><span>{formatCurrency(invoice.totalTaxAmount)}</span>
            </div>
            <div className="flex justify-between font-bold text-[9pt] pt-1">
              <span>GRAND TOTAL:</span><span>{formatCurrency(invoice.grandTotalAmount)}</span>
            </div>
          </div>
          <div className="mt-4 text-center text-[7pt] italic">Thank you for Shopping!</div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2 print:hidden">
          <Button variant="outline" className="w-full sm:w-auto" onClick={() => handlePrint('a4')}>
            <Printer className="mr-2 h-4 w-4" /> A4 Print
          </Button>
          <Button variant="outline" className="w-full sm:w-auto" onClick={() => handlePrint('receipt')}>
            <Receipt className="mr-2 h-4 w-4" /> Receipt (80mm)
          </Button>
          <Button className="w-full sm:w-auto" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function InvoicesPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewInvoice, setViewInvoice] = useState<Invoice | null>(null);

  useEffect(() => {
    if (!isUserLoading && (!user || user.isAnonymous)) {
      router.push("/login");
    }
  }, [user, isUserLoading, router]);

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
        const matchesSearch = inv.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) || inv.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || inv.status.toLowerCase() === statusFilter.toLowerCase();
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => new Date(b.invoiceDate).getTime() - new Date(a.invoiceDate).getTime());
  }, [invoices, searchTerm, statusFilter]);

  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount).replace('₹', 'Rs ');

  return (
    <div className="min-h-screen bg-background text-foreground">
      <MainHeader />
      <main className="container mx-auto p-4 md:p-6 lg:p-8">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h2 className="text-3xl font-bold font-headline">Invoice Dashboard</h2>
            <Button onClick={() => toast({ title: "Export", description: "Exporting feature coming soon." })} variant="outline">
              <Download className="mr-2 h-4 w-4" />Export CSV
            </Button>
          </div>
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <Tabs defaultValue="all" onValueChange={setStatusFilter}><TabsList><TabsTrigger value="all">All</TabsTrigger><TabsTrigger value="paid">Paid</TabsTrigger><TabsTrigger value="sent">Sent</TabsTrigger></TabsList></Tabs>
                <div className="relative w-full md:w-72">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search customer or ID..." className="pl-9" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isInvoicesLoading ? <Skeleton className="h-64 w-full" /> : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice #</TableHead><TableHead>Customer</TableHead><TableHead>Date</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Amount</TableHead><TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInvoices.map(invoice => (
                      <TableRow key={invoice.id}>
                        <TableCell><button onClick={() => setViewInvoice(invoice)} className="hover:underline text-primary">{invoice.invoiceNumber}</button></TableCell>
                        <TableCell>{invoice.customerName}</TableCell>
                        <TableCell>{invoice.invoiceDate}</TableCell>
                        <TableCell><Badge variant={invoice.status === 'Paid' ? 'default' : 'outline'}>{invoice.status}</Badge></TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(invoice.grandTotalAmount)}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setViewInvoice(invoice)}><Eye className="mr-2 h-4 w-4" />View</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => { setViewInvoice(invoice); setTimeout(() => window.print(), 200); }}><Printer className="mr-2 h-4 w-4" />Print A4</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => { setViewInvoice(invoice); setTimeout(() => window.print(), 200); }}><Receipt className="mr-2 h-4 w-4" />Print Receipt</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-destructive" onClick={() => deleteDocumentNonBlocking(doc(firestore!, `users/${user!.uid}/invoices/${invoice.id}`))}><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      <InvoiceDetailModal invoice={viewInvoice} userId={user?.uid || ''} isOpen={!!viewInvoice} onOpenChange={(open) => !open && setViewInvoice(null)} />
    </div>
  );
}
