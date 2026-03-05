"use client";

import { useEffect, useState, useMemo } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Trash2, Plus, User, Phone, Zap } from 'lucide-react';
import { InvoiceHeader } from './invoice-header';
import { InvoiceActions } from './invoice-actions';
import { useFirestore, useDoc, useCollection, useMemoFirebase, useCompanyProfile } from '@/firebase';
import { doc, collection, addDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { addDocumentNonBlocking, deleteDocumentNonBlocking, setDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import type { Invoice, InvoiceLineItem } from '@/lib/types';
import { Skeleton } from '../ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export function InvoiceForm({ userId }: { userId: string }) {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [printMode, setPrintMode] = useState<'a4' | 'receipt'>('a4');
  const invoiceId = 'main';

  const { data: companyProfile, isLoading: isCompanyProfileLoading } = useCompanyProfile(userId);

  const invoiceRef = useMemoFirebase(
    () => (firestore ? doc(firestore, `users/${userId}/invoices/${invoiceId}`) : null),
    [firestore, userId]
  );
  
  const lineItemsCollectionRef = useMemoFirebase(
    () => (invoiceRef ? collection(invoiceRef, 'lineItems') : null),
    [invoiceRef]
  );

  const lineItemsQuery = useMemoFirebase(
    () => (lineItemsCollectionRef ? query(lineItemsCollectionRef, orderBy('sortIndex', 'asc')) : null),
    [lineItemsCollectionRef]
  );

  const { data: invoice, isLoading: isInvoiceLoading } = useDoc<Invoice>(invoiceRef);
  const { data: lineItems, isLoading: areLineItemsLoading } = useCollection<InvoiceLineItem>(lineItemsQuery);

  useEffect(() => {
    if (!isInvoiceLoading && !invoice && !!invoiceRef) {
      const defaultInvoice: Omit<Invoice, 'id'> = {
        invoiceNumber: 'INV-001',
        invoiceDate: new Date().toISOString().split('T')[0],
        customerName: '',
        customerPhone: '',
        customerId: 'temp-customer',
        companyProfileId: 'main',
        subtotalAmount: 0,
        totalTaxAmount: 0,
        grandTotalAmount: 0,
        status: 'Draft',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        authorizedSignatureName: 'Proprietor',
      };
      setDocumentNonBlocking(invoiceRef!, defaultInvoice, { merge: false });
    }
  }, [isInvoiceLoading, !!invoice, !!invoiceRef]);
  
  const handleAddLineItem = () => {
    if (!lineItemsCollectionRef) return;
    const nextIndex = (lineItems?.length || 0);
    addDocumentNonBlocking(lineItemsCollectionRef, {
      description: "",
      quantity: "1",
      rate: 0,
      tax: 0,
      sortIndex: nextIndex,
    });
  };

  const handleRemoveLineItem = (id: string) => {
    if (!lineItemsCollectionRef) return;
    const lineItemRef = doc(lineItemsCollectionRef, id);
    deleteDocumentNonBlocking(lineItemRef);
  };

  const handleUpdateLineItem = (id: string, field: keyof Omit<InvoiceLineItem, 'id' | 'invoiceId'>, value: string | number) => {
    if (!lineItemsCollectionRef) return;
    const lineItemRef = doc(lineItemsCollectionRef, id);
    const isNumericField = field === 'rate' || field === 'tax' || field === 'sortIndex';
    const updatedValue = isNumericField ? (typeof value === 'string' ? parseFloat(value) || 0 : value) : value;
    updateDocumentNonBlocking(lineItemRef, { [field]: updatedValue });
  };
  
  const handleUpdateInvoice = (field: keyof Omit<Invoice, 'id'>, value: string) => {
    if (!invoiceRef) return;
    updateDocumentNonBlocking(invoiceRef, { [field]: value });
  }

  const handleSaveInvoice = async () => {
    if (!firestore || !userId || !invoice || !lineItems || !invoiceRef || !lineItemsCollectionRef) {
      toast({ variant: "destructive", title: "Error", description: "Invoice data not ready." });
      return;
    }
    if (!invoice.customerName) {
        toast({ variant: "destructive", title: "Customer Required", description: "Please provide a customer name." });
        return;
    }

    setIsSaving(true);
    const invoicesCollection = collection(firestore, `users/${userId}/invoices`);
    const invoiceDataToSave = { ...invoice, status: 'Sent' as const, updatedAt: new Date().toISOString() };
    const { id: dummyId, ...finalData } = invoiceDataToSave;

    try {
        const newDoc = await addDoc(invoicesCollection, finalData);
        const newLineItemsCol = collection(newDoc, 'lineItems');
        for (const item of lineItems) {
            const { id: itemId, ...itemData } = item;
            await addDoc(newLineItemsCol, itemData);
        }

        const match = invoice.invoiceNumber.match(/\d+$/);
        let nextNo = invoice.invoiceNumber;
        if (match) {
            const num = parseInt(match[0], 10) + 1;
            nextNo = invoice.invoiceNumber.substring(0, invoice.invoiceNumber.length - match[0].length) + String(num).padStart(match[0].length, '0');
        } else {
            nextNo += "-1";
        }

        updateDocumentNonBlocking(invoiceRef, {
            invoiceNumber: nextNo,
            invoiceDate: new Date().toISOString().split('T')[0],
            customerName: '',
            customerPhone: '',
            subtotalAmount: 0,
            totalTaxAmount: 0,
            grandTotalAmount: 0,
            updatedAt: new Date().toISOString(),
        });

        for (const item of lineItems) {
            await deleteDoc(doc(lineItemsCollectionRef, item.id));
        }

        toast({ title: "Invoice Saved", description: `Invoice ${invoice.invoiceNumber} recorded.` });
    } catch (error: any) {
        errorEmitter.emit('permission-error', new FirestorePermissionError({ path: invoicesCollection.path, operation: 'create', requestResourceData: finalData }));
        toast({ variant: "destructive", title: "Save Failed", description: "Could not save invoice." });
    } finally {
        setIsSaving(false);
    }
  };

  const totals = useMemo(() => {
    return (lineItems || []).reduce((acc, item) => {
      const qty = parseFloat(String(item.quantity).match(/^[0-9.]+/)?.[0] || '1') || 1;
      const amount = item.description === 'Labor cost' ? item.rate : qty * item.rate;
      const tax = amount * (item.tax / 100);
      acc.subtotal += amount;
      acc.taxTotal += tax;
      acc.grandTotal += amount + tax;
      return acc;
    }, { subtotal: 0, taxTotal: 0, grandTotal: 0 });
  }, [lineItems]);

  const { subtotal, taxTotal, grandTotal } = totals;

  useEffect(() => {
    if (!invoiceRef || !invoice) return;
    const hasChanged = Math.abs(invoice.subtotalAmount - subtotal) > 0.01 || Math.abs(invoice.totalTaxAmount - taxTotal) > 0.01 || Math.abs(invoice.grandTotalAmount - grandTotal) > 0.01;
    if (hasChanged) {
      updateDocumentNonBlocking(invoiceRef, { subtotalAmount: subtotal, totalTaxAmount: taxTotal, grandTotalAmount: grandTotal, updatedAt: new Date().toISOString() });
    }
  }, [subtotal, taxTotal, grandTotal, invoice?.id, invoiceRef]);
  
  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount).replace('₹', 'Rs ');

  const handlePrintA4 = () => {
    setPrintMode('a4');
    setTimeout(() => window.print(), 100);
  };

  const handlePrintReceipt = () => {
    setPrintMode('receipt');
    setTimeout(() => window.print(), 100);
  };

  if (isInvoiceLoading || areLineItemsLoading || isCompanyProfileLoading) {
    return (
      <Card className="max-w-4xl mx-auto">
        <CardContent className="p-6 space-y-8"><Skeleton className="h-32 w-full" /><Skeleton className="h-64 w-full" /></CardContent>
      </Card>
    );
  }

  const activeProfile = companyProfile || { name: 'DUBAI TOOLS', addressLine1: 'Shivdhara', phoneNumbers: ['9268863031', '7280944150'], email: 'dubaitools2026@gmail.com', gstRegistrationNumber: 'Qw1234766666s' };

  return (
    <>
      <style>{`
        @page { size: A4; margin: 5mm; }
        input[type="date"]::-webkit-calendar-picker-indicator { display: none !important; }
        
        @media screen {
          .receipt-view { display: none; }
        }

        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background: white !important; }
          body * { visibility: hidden; }
          
          /* A4 Mode */
          .print-a4 .invoice-a4-area, .print-a4 .invoice-a4-area * { visibility: visible; }
          .print-a4 .invoice-a4-area { 
            position: absolute; left: 0; top: 0; width: 100%; border: none !important; box-shadow: none !important; padding: 0 !important; font-size: 8pt; 
          }
          .print-a4 .receipt-view { display: none !important; }
          
          /* Receipt Mode */
          .print-receipt .receipt-view, .print-receipt .receipt-view * { visibility: visible; }
          .print-receipt .receipt-view {
            position: absolute; left: 0; top: 0; width: 80mm; padding: 2mm; font-family: monospace; font-size: 9pt; display: block !important;
          }
          .print-receipt .invoice-a4-area { display: none !important; }

          .print-no-border { border: none !important; background: transparent !important; box-shadow: none !important; padding: 0 !important; font-size: inherit !important; height: auto !important; }
          .invoice-table td, .invoice-table th { padding: 1px 2px !important; border-bottom: 0.5px solid #eee !important; font-size: 7.5pt !important; }
          .signature-area { page-break-inside: avoid; margin-top: 2mm; }
        }
      `}</style>

      <div className={printMode === 'a4' ? 'print-a4' : 'print-receipt'}>
        <Card className="max-w-4xl mx-auto invoice-a4-area p-2 sm:p-4 md:p-6 mb-8">
          <CardContent className="p-0">
            <div className="flex flex-col-reverse sm:flex-row justify-between items-start gap-4 mb-4 print:mb-1">
              <InvoiceHeader 
                companyProfile={companyProfile}
                invoiceNumber={invoice?.invoiceNumber || ''}
                onInvoiceNumberChange={(val) => handleUpdateInvoice('invoiceNumber', val)}
                invoiceDate={invoice?.invoiceDate || ''}
                onInvoiceDateChange={(val) => handleUpdateInvoice('invoiceDate', val)}
              />
              <InvoiceActions onSave={handleSaveInvoice} onPrintA4={handlePrintA4} onPrintReceipt={handlePrintReceipt} isSaving={isSaving} />
            </div>

            <Separator className="my-4 print:my-1" />

            <div className="grid md:grid-cols-2 gap-8 mb-4 print:mb-1">
              <div className="space-y-1">
                <Label className="font-headline text-sm print:text-[8pt]">Bill To</Label>
                <div className="border rounded-md p-3 space-y-2 bg-muted/5 print:p-0 print:border-none print:bg-transparent">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-primary shrink-0 opacity-70" />
                    <Input value={invoice?.customerName || ''} onChange={(e) => handleUpdateInvoice('customerName', e.target.value)} placeholder="Customer Name" className="print-no-border font-medium text-lg print:text-[9pt] h-auto p-0 border-none focus-visible:ring-0 shadow-none bg-transparent" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-primary shrink-0 opacity-70" />
                    <Input value={invoice?.customerPhone || ''} onChange={(e) => handleUpdateInvoice('customerPhone', e.target.value)} placeholder="Customer Phone" className="print-no-border text-sm print:text-[8pt] h-auto p-0 border-none focus-visible:ring-0 shadow-none bg-transparent" />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <Table className="invoice-table">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40px] print:w-[30px]">Item</TableHead>
                    <TableHead className="w-[40%]">Description</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Rate</TableHead>
                    <TableHead className="text-right">Tax%</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="print:hidden"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lineItems?.map((item, index) => {
                    const qty = parseFloat(String(item.quantity).match(/^[0-9.]+/)?.[0] || '1') || 1;
                    const amount = item.description === 'Labor cost' ? item.rate : qty * item.rate;
                    const total = amount * (1 + item.tax / 100);
                    return (
                      <TableRow key={item.id}>
                        <TableCell className="text-muted-foreground text-xs">{index + 1}</TableCell>
                        <TableCell><Input value={item.description} onChange={(e) => handleUpdateLineItem(item.id, 'description', e.target.value)} className="w-full print-no-border" /></TableCell>
                        <TableCell><Input value={item.quantity} onChange={(e) => handleUpdateLineItem(item.id, 'quantity', e.target.value)} className="w-12 text-right print-no-border" /></TableCell>
                        <TableCell><Input type="number" value={item.rate} onChange={(e) => handleUpdateLineItem(item.id, 'rate', e.target.value)} className="w-20 text-right print-no-border" /></TableCell>
                        <TableCell><Input type="number" value={item.tax} onChange={(e) => handleUpdateLineItem(item.id, 'tax', e.target.value)} className="w-12 text-right print-no-border" /></TableCell>
                        <TableCell className="text-right font-medium">{total.toFixed(2)}</TableCell>
                        <TableCell className="print:hidden"><Button variant="ghost" size="icon" onClick={() => handleRemoveLineItem(item.id)}><Trash2 className="h-4 w-4" /></Button></TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            <Button onClick={handleAddLineItem} variant="outline" className="mt-2 print:hidden"><Plus className="mr-2 h-4 w-4" /> Add Item</Button>

            <div className="flex justify-between items-end gap-8 mt-4 print:mt-2">
              <div className="signature-area flex flex-col items-start gap-1">
                <div className="relative h-12 w-24">
                  <Image src="/signature.jpeg" alt="Signature" width={100} height={50} className="object-contain" />
                </div>
                <div className="w-40 border-t border-dashed pt-1">
                  <Input value={invoice?.authorizedSignatureName || ''} onChange={(e) => handleUpdateInvoice('authorizedSignatureName', e.target.value)} placeholder="Authorized Name" className="print-no-border h-auto p-0 font-bold text-sm" />
                  <p className="text-[10px] text-muted-foreground">Authorized Signature</p>
                </div>
              </div>
              <div className="w-full md:w-1/3 space-y-1 text-sm print:text-[8pt]">
                <div className="flex justify-between"><span>Subtotal:</span><span>{formatCurrency(subtotal)}</span></div>
                <div className="flex justify-between"><span>Tax:</span><span>{formatCurrency(taxTotal)}</span></div>
                <Separator />
                <div className="flex justify-between font-bold text-lg print:text-[9pt] font-headline"><span>Total:</span><span>{formatCurrency(grandTotal)}</span></div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 80mm Thermal Receipt View */}
        <div className="receipt-view hidden">
          <div className="text-center space-y-1 mb-2">
            <div className="flex justify-center mb-1"><Zap className="h-6 w-6 text-primary" /></div>
            <h2 className="font-bold text-lg uppercase">{activeProfile.name}</h2>
            <p className="text-[8pt]">{activeProfile.addressLine1}</p>
            <p className="text-[8pt]">Ph: {activeProfile.phoneNumbers.join(', ')}</p>
            {activeProfile.gstRegistrationNumber && <p className="text-[8pt]">GST: {activeProfile.gstRegistrationNumber}</p>}
          </div>
          <Separator className="border-dashed my-2" />
          <div className="text-[8pt] space-y-1 mb-2">
            <div className="flex justify-between"><span>Inv: {invoice?.invoiceNumber}</span><span>{invoice?.invoiceDate}</span></div>
            <div className="font-bold">Bill To: {invoice?.customerName}</div>
            {invoice?.customerPhone && <div>Ph: {invoice?.customerPhone}</div>}
          </div>
          <Separator className="border-dashed my-2" />
          <table className="w-full text-[8pt]">
            <thead>
              <tr className="border-b border-dashed">
                <th className="text-left py-1"># Item</th>
                <th className="text-right py-1">Qty</th>
                <th className="text-right py-1">Total</th>
              </tr>
            </thead>
            <tbody>
              {lineItems?.map((item, idx) => {
                const qty = parseFloat(String(item.quantity).match(/^[0-9.]+/)?.[0] || '1') || 1;
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
              <span>Subtotal:</span><span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>Tax:</span><span>{formatCurrency(taxTotal)}</span>
            </div>
            <div className="flex justify-between font-bold text-[9pt] pt-1">
              <span>GRAND TOTAL:</span><span>{formatCurrency(grandTotal)}</span>
            </div>
          </div>
          <div className="mt-4 text-center text-[7pt] italic">Thank you for Shopping!</div>
        </div>
      </div>
    </>
  );
}
