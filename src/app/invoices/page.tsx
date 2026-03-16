'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useCollection, useFirestore, useMemoFirebase, deleteDocumentNonBlocking, useDoc, useCompanyProfile } from '@/firebase';
import { collection, query, where, doc, addDoc, updateDoc, getDocs, deleteDoc } from 'firebase/firestore';
import { Invoice, InvoiceLineItem, InventoryItem } from '@/lib/types';
import { MainHeader } from '@/components/main-header';
import { Button } from '@/components/ui/button';
import { Search, Trash2, MoreHorizontal, Printer, ReceiptText, Eye, Plus } from 'lucide-react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Image from 'next/image';

function AddItemToSavedInvoiceDialog({ 
  isOpen, 
  onOpenChange, 
  invoiceId, 
  userId, 
  onItemAdded 
}: { 
  isOpen: boolean, 
  onOpenChange: (open: boolean) => void, 
  invoiceId: string, 
  userId: string,
  onItemAdded: () => void
}) {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [rate, setRate] = useState(0);
  const [tax, setTax] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeSearch, setActiveSearch] = useState(false);

  const inventoryRef = useMemoFirebase(
    () => (firestore ? collection(firestore, `users/${userId}/inventory`) : null),
    [firestore, userId]
  );
  const { data: inventoryItems } = useCollection<InventoryItem>(inventoryRef);

  const matches = useMemo(() => {
    if (description.length < 2 || !inventoryItems) return [];
    return inventoryItems.filter(item => 
      item.name.toLowerCase().includes(description.toLowerCase())
    ).slice(0, 5);
  }, [description, inventoryItems]);

  const handleSubmit = async () => {
    if (!firestore || !userId || !invoiceId || !description) return;
    setIsSubmitting(true);

    try {
      const invoiceRef = doc(firestore, `users/${userId}/invoices/${invoiceId}`);
      const lineItemsCol = collection(invoiceRef, 'lineItems');
      
      await addDoc(lineItemsCol, {
        description,
        quantity,
        rate,
        tax,
        sortIndex: Date.now(),
      });

      const snap = await getDocs(lineItemsCol);
      let newSubtotal = 0;
      let newTaxTotal = 0;

      snap.docs.forEach(d => {
        const item = d.data();
        const qText = String(item.quantity).match(/^[0-9.]+/)?.[0] || '1';
        const q = parseFloat(qText) || 1;
        const labor = item.description.toLowerCase().includes('labor');
        const a = labor ? item.rate : q * item.rate;
        const t = a * (item.tax / 100);
        newSubtotal += a;
        newTaxTotal += t;
      });

      await updateDoc(invoiceRef, {
        subtotalAmount: newSubtotal,
        totalTaxAmount: newTaxTotal,
        grandTotalAmount: newSubtotal + newTaxTotal,
        updatedAt: new Date().toISOString(),
      });

      toast({ title: "Item Added", description: "The invoice totals have been updated." });
      onItemAdded();
      onOpenChange(false);
      setDescription('');
      setQuantity('1');
      setRate(0);
      setTax(0);
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: "Failed to add item." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Item to Invoice</DialogTitle>
          <DialogDescription>Add a new supply or labor charge to this saved invoice.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2 relative">
            <Label>Description</Label>
            <Input 
              value={description} 
              onChange={(e) => setDescription(e.target.value)} 
              onFocus={() => setActiveSearch(true)}
              onBlur={() => setTimeout(() => setActiveSearch(false), 200)}
              placeholder="Search stock or type description..." 
            />
            {activeSearch && matches.length > 0 && (
              <div className="absolute left-0 top-full z-[100] w-full border bg-card shadow-lg rounded-md mt-1 overflow-hidden">
                {matches.map(m => (
                  <button 
                    key={m.id}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-primary/10 flex justify-between items-center"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setDescription(m.name);
                      setRate(m.sellingPrice);
                      setActiveSearch(false);
                    }}
                  >
                    <span>{m.name}</span>
                    <span className="font-bold text-primary">Rs {m.sellingPrice}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Qty</Label>
              <Input value={quantity} onChange={(e) => setQuantity(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Rate</Label>
              <Input type="number" value={rate} onChange={(e) => setRate(parseFloat(e.target.value) || 0)} />
            </div>
            <div className="space-y-2">
              <Label>Tax %</Label>
              <Input type="number" value={tax} onChange={(e) => setTax(parseFloat(e.target.value) || 0)} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Adding...' : 'Add to Invoice'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function InvoiceDetailModal({ invoiceId, userId, isOpen, onOpenChange, initialPrintMode }: { 
  invoiceId: string | null, 
  userId: string, 
  isOpen: boolean, 
  onOpenChange: (open: boolean) => void,
  initialPrintMode?: 'a4' | 'receipt'
}) {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [printMode, setPrintMode] = useState<'a4' | 'receipt'>(initialPrintMode || 'a4');
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);

  useEffect(() => {
    if (initialPrintMode) setPrintMode(initialPrintMode);
  }, [initialPrintMode]);

  const { data: companyProfile } = useCompanyProfile(userId);

  const invoiceRef = useMemoFirebase(
    () => (firestore && userId && invoiceId ? doc(firestore, `users/${userId}/invoices/${invoiceId}`) : null),
    [firestore, userId, invoiceId]
  );
  
  const { data: invoice, isLoading: isInvoiceLoading } = useDoc<Invoice>(invoiceRef);

  const lineItemsRef = useMemoFirebase(
    () => (firestore && userId && invoiceId ? collection(firestore, `users/${userId}/invoices/${invoiceId}/lineItems`) : null),
    [firestore, userId, invoiceId]
  );
  const { data: lineItems, isLoading: areLineItemsLoading } = useCollection<InvoiceLineItem>(lineItemsRef);

  const handleStatusChange = async (newStatus: string) => {
    if (!firestore || !userId || !invoiceId) return;
    try {
      const docRef = doc(firestore, `users/${userId}/invoices/${invoiceId}`);
      await updateDoc(docRef, { 
        status: newStatus,
        updatedAt: new Date().toISOString()
      });
      toast({ title: "Status Updated", description: `Invoice status changed to ${newStatus}.` });
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: "Failed to update status." });
    }
  };

  const handleDeleteLineItem = async (lineItemId: string) => {
    if (!firestore || !userId || !invoiceId) return;
    if (!confirm("Are you sure you want to remove this item?")) return;

    try {
      const lineItemRef = doc(firestore, `users/${userId}/invoices/${invoiceId}/lineItems/${lineItemId}`);
      await deleteDoc(lineItemRef);

      const lineItemsCol = collection(firestore, `users/${userId}/invoices/${invoiceId}/lineItems`);
      const snap = await getDocs(lineItemsCol);
      
      let newSubtotal = 0;
      let newTaxTotal = 0;

      snap.docs.forEach(d => {
        const item = d.data();
        const qText = String(item.quantity).match(/^[0-9.]+/)?.[0] || '1';
        const q = parseFloat(qText) || 1;
        const labor = item.description.toLowerCase().includes('labor');
        const a = labor ? item.rate : q * item.rate;
        const t = a * (item.tax / 100);
        newSubtotal += a;
        newTaxTotal += t;
      });

      const invoiceRef = doc(firestore, `users/${userId}/invoices/${invoiceId}`);
      await updateDoc(invoiceRef, {
        subtotalAmount: newSubtotal,
        totalTaxAmount: newTaxTotal,
        grandTotalAmount: newSubtotal + newTaxTotal,
        updatedAt: new Date().toISOString(),
      });

      toast({ title: "Item Removed", description: "The invoice totals have been updated." });
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: "Failed to remove item." });
    }
  };

  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-IN', { 
    style: 'currency', 
    currency: 'INR'
  }).format(amount || 0).replace('₹', 'Rs ');

  const handlePrint = (mode: 'a4' | 'receipt') => {
    setPrintMode(mode);
    setTimeout(() => window.print(), 300);
  };

  const activeProfile = companyProfile || { 
    name: 'DUBAI TOOLS', 
    addressLine1: 'Shivdhara', 
    phoneNumbers: ['9268863031', '7280944150'], 
    email: 'dubaitools2026@gmail.com', 
    gstRegistrationNumber: 'Qw1234766666s' 
  };

  if (!invoiceId) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className={`max-w-3xl max-h-[90vh] overflow-y-auto ${printMode === 'a4' ? 'print-a4' : 'print-receipt'}`}>
          <style>{`
            @media screen { 
              .receipt-view-modal { display: none; } 
            }
            @media print {
              body * { visibility: hidden; }
              [data-radix-portal] { visibility: visible !important; position: absolute; left: 0; top: 0; width: 100%; }
              [data-radix-portal] *, 
              .invoice-detail-print, 
              .invoice-detail-print *,
              .receipt-view-modal,
              .receipt-view-modal * { visibility: visible !important; }
              
              .invoice-detail-print, .receipt-view-modal { display: none !important; }

              .print-a4 .invoice-detail-print {
                display: block !important;
                width: 100% !important;
                padding: 10mm !important;
              }
              
              .print-receipt .receipt-view-modal {
                display: block !important;
                width: 80mm !important;
                padding: 5mm !important;
              }

              .print-hidden, 
              [role="dialog"] button[aria-label="Close"], 
              .dialog-footer-print,
              .dropdown-trigger-print { display: none !important; }
              
              * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            }
          `}</style>
          
          <DialogHeader className="print-hidden flex flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Image src="/dubaitools.png" alt="Logo" width={32} height={32} className="object-contain" />
              <div>
                <DialogTitle className="text-xl font-headline text-primary uppercase leading-none">Dubai Tools</DialogTitle>
                <DialogDescription className="text-xs">Invoice: {invoice?.invoiceNumber}</DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {isInvoiceLoading ? (
            <div className="py-20 text-center">Loading invoice details...</div>
          ) : invoice && (
            <div className="invoice-detail-print space-y-4 py-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <Image src="/dubaitools.png" alt="Logo" width={42} height={42} className="object-contain" />
                    <div className="space-y-0">
                      <h2 className="text-lg font-headline font-bold text-primary leading-none uppercase">{activeProfile.name}</h2>
                      <p className="text-[10px] text-muted-foreground leading-tight mt-1">{activeProfile.addressLine1}</p>
                      <div className="text-[9px] text-muted-foreground flex flex-wrap gap-x-2 mt-0">
                        {activeProfile.phoneNumbers?.length > 0 && <p>Ph: {activeProfile.phoneNumbers.join(', ')}</p>}
                        {activeProfile.email && <p>Email: {activeProfile.email}</p>}
                        {activeProfile.gstRegistrationNumber && <p>GST: {activeProfile.gstRegistrationNumber}</p>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 print-hidden">
                    <Button variant="outline" size="sm" onClick={() => setIsAddItemOpen(true)}>
                      <Plus className="mr-2 h-4 w-4" /> Add Item
                    </Button>
                    <Select value={invoice.status} onValueChange={handleStatusChange}>
                      <SelectTrigger className="w-[120px] h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Draft">Draft</SelectItem>
                        <SelectItem value="Sent">Sent</SelectItem>
                        <SelectItem value="Paid">Paid</SelectItem>
                        <SelectItem value="Overdue">Overdue</SelectItem>
                        <SelectItem value="Cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
              </div>
              
              <div className="grid grid-cols-2 gap-8 text-sm pt-2">
                <div>
                  <p className="text-muted-foreground mb-1 uppercase text-[10px] font-bold tracking-wider">Bill To</p>
                  <div className="border rounded-md p-2 space-y-1 bg-muted/5 print:p-0 print:border-none">
                    <p className="font-bold text-base leading-tight">{invoice.customerName}</p>
                    {invoice.customerPhone && <p className="text-muted-foreground text-xs">Ph: {invoice.customerPhone}</p>}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-muted-foreground mb-1 uppercase text-[10px] font-bold tracking-wider">Date Issued</p>
                  <p className="font-medium text-sm">{format(new Date(`${invoice.invoiceDate}T00:00:00`), 'PP')}</p>
                  <p className="text-muted-foreground text-[10px]">Invoice #: {invoice.invoiceNumber}</p>
                </div>
              </div>

              <div className="rounded-md border overflow-hidden mt-2">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow className="h-8">
                      <TableHead className="w-[30px] h-8 text-[10px]">#</TableHead>
                      <TableHead className="h-8 text-[10px]">Description</TableHead>
                      <TableHead className="text-right h-8 text-[10px]">Qty</TableHead>
                      <TableHead className="text-right h-8 text-[10px]">Total</TableHead>
                      <TableHead className="text-right print-hidden h-8 text-[10px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {areLineItemsLoading ? (
                      <TableRow><TableCell colSpan={5} className="text-center py-8">Loading...</TableCell></TableRow>
                    ) : lineItems?.map((item, idx) => {
                      const qText = String(item.quantity).match(/^[0-9.]+/)?.[0] || '1';
                      const qty = parseFloat(qText) || 1;
                      const isLabor = item.description.toLowerCase().includes('labor');
                      const amount = isLabor ? item.rate : qty * item.rate;
                      const total = amount * (1 + item.tax / 100);
                      return (
                        <TableRow key={item.id} className="h-8">
                          <TableCell className="text-muted-foreground text-[10px] py-1">{idx + 1}</TableCell>
                          <TableCell className="font-medium text-xs py-1">{item.description}</TableCell>
                          <TableCell className="text-right text-xs py-1">{item.quantity}</TableCell>
                          <TableCell className="text-right font-bold text-xs py-1">{total.toFixed(2)}</TableCell>
                          <TableCell className="text-right print-hidden py-1">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="text-destructive h-6 w-6" 
                              onClick={() => handleDeleteLineItem(item.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>

              <div className="flex justify-between items-end gap-8 pt-2">
                <div className="signature-area flex flex-col items-start gap-1">
                  <div className="relative h-10 w-20">
                    <Image src="/signature.jpeg" alt="Signature" width={80} height={40} className="object-contain" />
                  </div>
                  <div className="w-32 border-t border-dashed pt-1">
                    <p className="text-[9px] text-muted-foreground">Authorized Signature</p>
                  </div>
                </div>
                <div className="w-full md:w-1/2 space-y-1 text-right">
                  <div className="flex justify-between px-2 text-xs"><span>Subtotal</span><span>{formatCurrency(invoice.subtotalAmount)}</span></div>
                  <div className="flex justify-between px-2 text-xs"><span>Tax</span><span>{formatCurrency(invoice.totalTaxAmount)}</span></div>
                  <Separator />
                  <div className="flex justify-between bg-primary/5 p-2 rounded-lg border border-primary/20">
                    <span className="font-headline font-bold text-primary text-sm">Grand Total</span>
                    <span className="font-headline font-bold text-lg text-primary">{formatCurrency(invoice.grandTotalAmount)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {invoice && (
            <div className="receipt-view-modal hidden">
              <div className="text-center space-y-0 mb-1">
                <div className="flex justify-center mb-1">
                  <Image src="/dubaitools.png" alt="Logo" width={32} height={32} className="object-contain" />
                </div>
                <h2 className="font-bold text-base uppercase leading-tight">{activeProfile.name}</h2>
                <p className="text-[7pt] leading-tight mt-0.5">{activeProfile.addressLine1}</p>
                <div className="text-[7pt] space-y-0 mt-0.5">
                  <p>Ph: {activeProfile.phoneNumbers?.join(', ')}</p>
                  {activeProfile.email && <p>Email: {activeProfile.email}</p>}
                  {activeProfile.gstRegistrationNumber && <p>GST: {activeProfile.gstRegistrationNumber}</p>}
                </div>
              </div>
              <Separator className="border-dashed my-1" />
              <div className="text-[7pt] space-y-0.5 mb-1">
                <div className="flex justify-between"><span>Inv: {invoice.invoiceNumber}</span><span>{invoice.invoiceDate}</span></div>
                <div className="font-bold">Bill To: {invoice.customerName}</div>
              </div>
              <Separator className="border-dashed my-1" />
              <table className="w-full text-[7pt]">
                <thead>
                  <tr className="border-b border-dashed">
                    <th className="text-left py-0.5">Item</th>
                    <th className="text-right py-0.5">Qty</th>
                    <th className="text-right py-0.5">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {lineItems?.map((item, idx) => {
                    const qText = String(item.quantity).match(/^[0-9.]+/)?.[0] || '1';
                    const qty = parseFloat(qText) || 1;
                    const isLabor = item.description.toLowerCase().includes('labor');
                    const amount = isLabor ? item.rate : qty * item.rate;
                    const total = amount * (1 + item.tax / 100);
                    return (
                      <tr key={item.id} className="border-b border-dashed border-gray-50">
                        <td className="py-0.5">{idx + 1}. {item.description}</td>
                        <td className="text-right py-0.5">{item.quantity}</td>
                        <td className="text-right py-0.5">{total.toFixed(2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div className="mt-1 space-y-0.5 text-[7pt]">
                <div className="flex justify-between border-t border-dashed pt-1">
                  <span>Subtotal:</span><span>{formatCurrency(invoice.subtotalAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax:</span><span>{formatCurrency(invoice.totalTaxAmount)}</span>
                </div>
                <div className="flex justify-between font-bold text-[8pt] pt-0.5">
                  <span>GRAND TOTAL:</span><span>{formatCurrency(invoice.grandTotalAmount)}</span>
                </div>
              </div>
              <div className="mt-2 text-center text-[6pt] italic">Thank you for Shopping!</div>
            </div>
          )}

          <DialogFooter className="flex flex-col sm:flex-row gap-2 print-hidden dialog-footer-print mt-4">
            <Button variant="outline" className="w-full sm:w-auto" onClick={() => handlePrint('a4')}>
              <Printer className="mr-2 h-4 w-4" /> A4 Print
            </Button>
            <Button variant="outline" className="w-full sm:w-auto" onClick={() => handlePrint('receipt')}>
              <ReceiptText className="mr-2 h-4 w-4" /> Receipt (80mm)
            </Button>
            <Button className="w-full sm:w-auto" onClick={() => onOpenChange(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {invoiceId && (
        <AddItemToSavedInvoiceDialog 
          isOpen={isAddItemOpen} 
          onOpenChange={setIsAddItemOpen} 
          invoiceId={invoiceId} 
          userId={userId}
          onItemAdded={() => {}} 
        />
      )}
    </>
  );
}

export default function InvoicesPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewInvoiceId, setViewInvoiceId] = useState<string | null>(null);
  const [initialPrintMode, setInitialPrintMode] = useState<'a4' | 'receipt' | undefined>(undefined);

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

  const handlePrintRequest = (id: string, mode: 'a4' | 'receipt') => {
    setViewInvoiceId(id);
    setInitialPrintMode(mode);
    setTimeout(() => {
      window.print();
    }, 500);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <MainHeader />
      <main className="container mx-auto p-4 md:p-6 lg:p-8">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h2 className="text-3xl font-bold font-headline">Invoice Dashboard</h2>
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
                        <TableCell><button onClick={() => { setViewInvoiceId(invoice.id); setInitialPrintMode(undefined); }} className="hover:underline text-primary">{invoice.invoiceNumber}</button></TableCell>
                        <TableCell>{invoice.customerName}</TableCell>
                        <TableCell>{invoice.invoiceDate}</TableCell>
                        <TableCell><Badge variant={invoice.status === 'Paid' ? 'default' : 'outline'}>{invoice.status}</Badge></TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(invoice.grandTotalAmount)}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="dropdown-trigger-print"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => { setViewInvoiceId(invoice.id); setInitialPrintMode(undefined); }}><Eye className="mr-2 h-4 w-4" />View</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handlePrintRequest(invoice.id, 'a4')}><Printer className="mr-2 h-4 w-4" />Print A4</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handlePrintRequest(invoice.id, 'receipt')}><ReceiptText className="mr-2 h-4 w-4" />Print Receipt</DropdownMenuItem>
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
      <InvoiceDetailModal 
        invoiceId={viewInvoiceId} 
        userId={user?.uid || ''} 
        isOpen={!!viewInvoiceId} 
        onOpenChange={(open) => !open && setViewInvoiceId(null)} 
        initialPrintMode={initialPrintMode}
      />
    </div>
  );
}
