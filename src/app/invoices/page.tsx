'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useCollection, useFirestore, useMemoFirebase, deleteDocumentNonBlocking, useDoc } from '@/firebase';
import { collection, query, where, doc, addDoc, updateDoc, getDocs, deleteDoc } from 'firebase/firestore';
import { Invoice, InvoiceLineItem, InventoryItem } from '@/lib/types';
import { MainHeader } from '@/components/main-header';
import { Button } from '@/components/ui/button';
import { Search, Trash2, MoreHorizontal, Printer, Receipt, Eye, Plus, Package } from 'lucide-react';
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
import { PlugZap } from 'lucide-react';

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
      
      const qtyNum = parseFloat(quantity) || 1;
      const isLabor = description.toLowerCase().includes('labor');
      const amount = isLabor ? rate : qtyNum * rate;

      // 1. Add the line item
      await addDoc(lineItemsCol, {
        description,
        quantity,
        rate,
        tax,
        sortIndex: Date.now(),
      });

      // 2. Fetch all line items to get accurate totals
      const snap = await getDocs(lineItemsCol);
      let newSubtotal = 0;
      let newTaxTotal = 0;

      snap.docs.forEach(d => {
        const item = d.data();
        const q = parseFloat(item.quantity) || 1;
        const labor = item.description.toLowerCase().includes('labor');
        const a = labor ? item.rate : q * item.rate;
        const t = a * (item.tax / 100);
        newSubtotal += a;
        newTaxTotal += t;
      });

      // 3. Update the invoice doc
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

function InvoiceDetailModal({ invoiceId, userId, isOpen, onOpenChange }: { invoiceId: string | null, userId: string, isOpen: boolean, onOpenChange: (open: boolean) => void }) {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [printMode, setPrintMode] = useState<'a4' | 'receipt'>('a4');
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);

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

      // Recalculate totals after deletion
      const lineItemsCol = collection(firestore, `users/${userId}/invoices/${invoiceId}/lineItems`);
      const snap = await getDocs(lineItemsCol);
      
      let newSubtotal = 0;
      let newTaxTotal = 0;

      snap.docs.forEach(d => {
        const item = d.data();
        const q = parseFloat(item.quantity) || 1;
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

  if (!invoiceId) return null;

  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-IN', { 
    style: 'currency', 
    currency: 'INR'
  }).format(amount).replace('₹', 'Rs ');

  const handlePrint = (mode: 'a4' | 'receipt') => {
    setPrintMode(mode);
    setTimeout(() => window.print(), 100);
  };

  const activeProfile = { 
    name: 'DUBAI TOOLS', 
    addressLine1: 'Shivdhara', 
    phoneNumbers: ['9268863031', '7280944150'], 
    email: 'dubaitools2026@gmail.com', 
    gstRegistrationNumber: 'Qw1234766666s' 
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className={`max-w-3xl max-h-[90vh] overflow-y-auto ${printMode === 'a4' ? 'print-a4' : 'print-receipt'}`}>
          <style>{`
            @media screen { 
              .receipt-view-modal { display: none; } 
            }
            @media print {
              body { background: white !important; overflow: visible !important; }
              body > * { visibility: hidden !important; }
              [data-radix-portal], [data-radix-portal] * { visibility: visible !important; }
              
              .print-a4 .invoice-detail-print {
                position: fixed !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                height: auto !important;
                border: none !important;
                padding: 10mm !important;
                background: white !important;
                z-index: 99999 !important;
                font-size: 8pt;
              }
              
              .print-receipt .receipt-view-modal {
                position: fixed !important;
                left: 0 !important;
                top: 0 !important;
                width: 80mm !important;
                height: auto !important;
                padding: 4mm !important;
                background: white !important;
                z-index: 99999 !important;
                display: block !important;
                font-family: monospace;
                font-size: 9pt;
              }
              
              /* Hide modal UI elements during print */
              [role="dialog"] > button,
              .print-hidden,
              .dialog-footer-print { display: none !important; }
              
              thead { display: table-header-group !important; }
            }
          `}</style>
          
          <DialogHeader className="print:hidden">
            <DialogTitle className="text-2xl font-headline text-primary">Invoice Details</DialogTitle>
            <DialogDescription>Reference: {invoice?.invoiceNumber}</DialogDescription>
          </DialogHeader>

          {isInvoiceLoading ? (
            <div className="py-20 text-center">Loading invoice details...</div>
          ) : invoice && (
            <div className="invoice-detail-print space-y-6 py-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <PlugZap className="h-8 w-8 text-primary" />
                    <div>
                      <h2 className="text-xl font-headline font-bold text-primary">{activeProfile.name}</h2>
                      <p className="text-xs text-muted-foreground">{activeProfile.addressLine1}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 print:hidden">
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
                  <p className="text-muted-foreground text-xs">Invoice #: {invoice.invoiceNumber}</p>
                </div>
              </div>

              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead className="w-[40px]">#</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-right print:hidden">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {areLineItemsLoading ? (
                      <TableRow><TableCell colSpan={5} className="text-center py-12">Loading...</TableCell></TableRow>
                    ) : lineItems?.map((item, idx) => {
                      const qty = parseFloat(item.quantity) || 1;
                      const isLabor = item.description.toLowerCase().includes('labor');
                      const amount = isLabor ? item.rate : qty * item.rate;
                      const total = amount * (1 + item.tax / 100);
                      return (
                        <TableRow key={item.id}>
                          <TableCell className="text-muted-foreground text-xs">{idx + 1}</TableCell>
                          <TableCell className="font-medium">{item.description}</TableCell>
                          <TableCell className="text-right">{item.quantity}</TableCell>
                          <TableCell className="text-right font-bold">{total.toFixed(2)}</TableCell>
                          <TableCell className="text-right print:hidden">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="text-destructive h-8 w-8" 
                              onClick={() => handleDeleteLineItem(item.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
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
                  <div className="flex justify-between px-2 text-sm"><span>Subtotal</span><span>{formatCurrency(invoice.subtotalAmount)}</span></div>
                  <div className="flex justify-between px-2 text-sm"><span>Tax</span><span>{formatCurrency(invoice.totalTaxAmount)}</span></div>
                  <Separator />
                  <div className="flex justify-between bg-primary/5 p-4 rounded-lg border border-primary/20">
                    <span className="font-headline font-bold text-primary">Grand Total</span>
                    <span className="font-headline font-bold text-2xl text-primary">{formatCurrency(invoice.grandTotalAmount)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {invoice && (
            <div className="receipt-view-modal hidden">
              <div className="text-center space-y-1 mb-2">
                <div className="flex justify-center mb-1"><PlugZap className="h-6 w-6 text-primary" /></div>
                <h2 className="font-bold text-lg uppercase">{activeProfile.name}</h2>
                <p className="text-[8pt]">{activeProfile.addressLine1}</p>
                <p className="text-[8pt]">Ph: {activeProfile.phoneNumbers.join(', ')}</p>
              </div>
              <Separator className="border-dashed my-2" />
              <div className="text-[8pt] space-y-1 mb-2">
                <div className="flex justify-between"><span>Inv: {invoice.invoiceNumber}</span><span>{invoice.invoiceDate}</span></div>
                <div className="font-bold">Bill To: {invoice.customerName}</div>
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
                    const isLabor = item.description.toLowerCase().includes('labor');
                    const amount = isLabor ? item.rate : qty * item.rate;
                    const total = amount * (1 + item.tax / 100);
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
          )}

          <DialogFooter className="flex flex-col sm:flex-row gap-2 print:hidden dialog-footer-print">
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
                        <TableCell><button onClick={() => setViewInvoiceId(invoice.id)} className="hover:underline text-primary">{invoice.invoiceNumber}</button></TableCell>
                        <TableCell>{invoice.customerName}</TableCell>
                        <TableCell>{invoice.invoiceDate}</TableCell>
                        <TableCell><Badge variant={invoice.status === 'Paid' ? 'default' : 'outline'}>{invoice.status}</Badge></TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(invoice.grandTotalAmount)}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setViewInvoiceId(invoice.id)}><Eye className="mr-2 h-4 w-4" />View</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => { setViewInvoiceId(invoice.id); setTimeout(() => window.print(), 200); }}><Printer className="mr-2 h-4 w-4" />Print A4</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => { setViewInvoiceId(invoice.id); setTimeout(() => window.print(), 200); }}><Receipt className="mr-2 h-4 w-4" />Print Receipt</DropdownMenuItem>
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
      <InvoiceDetailModal invoiceId={viewInvoiceId} userId={user?.uid || ''} isOpen={!!viewInvoiceId} onOpenChange={(open) => !open && setViewInvoiceId(null)} />
    </div>
  );
}
