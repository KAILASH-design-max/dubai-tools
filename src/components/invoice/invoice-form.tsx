
"use client";

import { useEffect, useState, useMemo } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Trash2, Plus, Loader2 } from 'lucide-react';
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
  const invoiceId = 'main';

  const { data: companyProfile, isLoading: isCompanyProfileLoading } = useCompanyProfile(userId);

  const invoiceRef = useMemoFirebase(
    () => (firestore ? doc(firestore, `users/${userId}/invoices/${invoiceId}`) : null),
    [firestore, userId, invoiceId]
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

  // Initialize main invoice document if it doesn't exist
  useEffect(() => {
    // Explicitly check for all conditions to maintain hook stability
    const shouldInitialize = !isInvoiceLoading && !invoice && !!invoiceRef;
    
    if (shouldInitialize && invoiceRef) {
      const defaultInvoice: Omit<Invoice, 'id'> = {
        invoiceNumber: 'INV-001',
        invoiceDate: new Date().toISOString().split('T')[0],
        customerName: '',
        customerId: 'temp-customer',
        companyProfileId: 'main',
        subtotalAmount: 0,
        totalTaxAmount: 0,
        grandTotalAmount: 0,
        status: 'Draft',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setDocumentNonBlocking(invoiceRef, defaultInvoice, { merge: false });
    }
  }, [isInvoiceLoading, invoice, invoiceRef]);
  
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
      toast({
        variant: "destructive",
        title: "Error",
        description: "Invoice data not ready to be saved.",
      });
      return;
    }

    if (!invoice.customerName) {
        toast({
            variant: "destructive",
            title: "Customer Required",
            description: "Please provide a customer name before saving.",
        });
        return;
    }

    setIsSaving(true);
    const invoicesCollection = collection(firestore, `users/${userId}/invoices`);
    
    const invoiceToSave = {
        ...invoice,
        status: 'Sent' as const,
        updatedAt: new Date().toISOString(),
    };
    const { id: dummyId, ...invoiceDataToSave } = invoiceToSave;

    try {
        const newInvoiceDocRef = await addDoc(invoicesCollection, invoiceDataToSave);
        
        const newLineItemsCollection = collection(newInvoiceDocRef, 'lineItems');
        const sortedItems = [...lineItems].sort((a, b) => a.sortIndex - b.sortIndex);
        for (const item of sortedItems) {
            const { id: itemId, ...lineItemData } = item;
            await addDoc(newLineItemsCollection, lineItemData);
        }

        const currentInvoiceNumber = invoice.invoiceNumber;
        const numberMatch = currentInvoiceNumber.match(/\d+$/);
        let nextInvoiceNumber = currentInvoiceNumber;
        
        if (numberMatch) {
            const numberPart = numberMatch[0];
            const prefix = currentInvoiceNumber.substring(0, currentInvoiceNumber.length - numberPart.length);
            const number = parseInt(numberPart, 10) + 1;
            const nextNumberString = String(number).padStart(numberPart.length, '0');
            nextInvoiceNumber = `${prefix}${nextNumberString}`;
        } else {
            nextInvoiceNumber = currentInvoiceNumber + "-1";
        }

        updateDocumentNonBlocking(invoiceRef, {
            invoiceNumber: nextInvoiceNumber,
            invoiceDate: new Date().toISOString().split('T')[0],
            customerName: '',
            customerId: 'temp-customer',
            subtotalAmount: 0,
            totalTaxAmount: 0,
            grandTotalAmount: 0,
            updatedAt: new Date().toISOString(),
        });

        for (const item of lineItems) {
            await deleteDoc(doc(lineItemsCollectionRef, item.id));
        }

        toast({
          title: "Invoice Saved",
          description: `Invoice ${invoice.invoiceNumber} has been successfully recorded.`,
        });
    } catch (error: any) {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: invoicesCollection.path,
          operation: 'create',
          requestResourceData: invoiceDataToSave
        }));
        
        toast({
          variant: "destructive",
          title: "Save Failed",
          description: "There was an error saving your invoice. Please check your permissions.",
        });
    } finally {
        setIsSaving(false);
    }
  };

  const totals = useMemo(() => {
    return (lineItems || []).reduce((acc, item) => {
      const quantityAsString = String(item.quantity);
      const quantityMatch = quantityAsString.match(/^[0-9.]+/);
      const quantityAsNumber = quantityMatch ? parseFloat(quantityMatch[0]) : 1;
      const quantity = isNaN(quantityAsNumber) ? 1 : quantityAsNumber;
      
      let amount = 0;
      if (item.description === 'Labor cost') {
          amount = item.rate;
      } else {
          amount = quantity * item.rate;
      }
      
      const taxAmount = amount * (item.tax / 100);
      acc.subtotal += amount;
      acc.taxTotal += taxAmount;
      acc.grandTotal += amount + taxAmount;
      return acc;
    }, { subtotal: 0, taxTotal: 0, grandTotal: 0 });
  }, [lineItems]);

  const { subtotal, taxTotal, grandTotal } = totals;

  useEffect(() => {
    if (invoiceRef && invoice && (
      Math.abs(invoice.subtotalAmount - subtotal) > 0.01 ||
      Math.abs(invoice.totalTaxAmount - taxTotal) > 0.01 ||
      Math.abs(invoice.grandTotalAmount - grandTotal) > 0.01
    )) {
      updateDocumentNonBlocking(invoiceRef, {
        subtotalAmount: subtotal,
        totalTaxAmount: taxTotal,
        grandTotalAmount: grandTotal,
        updatedAt: new Date().toISOString()
      });
    }
  }, [subtotal, taxTotal, grandTotal, invoice, invoiceRef]);
  
  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount).replace('₹', 'Rs ');

  if (isInvoiceLoading || areLineItemsLoading || isCompanyProfileLoading) {
    return (
      <Card className="max-w-4xl mx-auto">
        <CardContent className="p-2 sm:p-4 md:p-6 space-y-8">
           <Skeleton className="h-32 w-full" />
           <Skeleton className="h-64 w-full" />
           <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <style>{`
        @page {
          size: A4;
          margin: 10mm;
        }

        input[type="date"]::-webkit-calendar-picker-indicator {
            display: none !important;
            -webkit-appearance: none;
            margin: 0;
        }
        input[type="date"].hide-calendar-icon {
            padding-right: 0.75rem !important;
        }

        @media print {
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            font-size: 10pt;
          }
          body * { visibility: hidden; }
          .invoice-print-area, .invoice-print-area * { visibility: visible; }
          .invoice-print-area { 
            position: absolute; 
            left: 0; 
            top: 0; 
            width: 100%;
            height: auto;
            margin: 0;
            padding: 5mm;
            box-sizing: border-box;
            border: none !important;
            box-shadow: none !important;
           }
          
          thead {
            display: table-header-group !important;
          }
          
          thead tr th {
            font-weight: bold;
            padding: 4px 2px !important;
          }

          tr {
            page-break-inside: avoid;
          }

          .invoice-table tbody tr:nth-child(20) {
            page-break-after: always;
          }

          .print-no-border, .print-no-border:focus, .print-no-border:hover {
            border: none !important;
            background: transparent !important;
            box-shadow: none !important;
            padding: 0 !important;
            -webkit-appearance: none;
            -moz-appearance: none;
            appearance: none;
            color: inherit !important;
          }
          
          input.print-no-border {
            padding: 0 !important;
            height: auto !important;
            font-size: 10pt !important;
          }

          .invoice-totals-area {
            page-break-inside: avoid;
            margin-top: 5mm;
          }

          .signature-area {
            page-break-inside: avoid;
            margin-top: 10mm;
          }

          .invoice-table td {
             padding: 4px 2px !important;
             font-size: 9pt !important;
          }

          .invoice-table th {
             font-size: 9pt !important;
          }
        }
      `}</style>
      <Card className="max-w-4xl mx-auto invoice-print-area p-2 sm:p-4 md:p-6">
        <CardContent className="p-0">
          <div className="flex flex-col-reverse sm:flex-row justify-between items-start gap-4 mb-6 print:mb-2">
            <InvoiceHeader 
              companyProfile={companyProfile}
              invoiceNumber={invoice?.invoiceNumber || ''}
              onInvoiceNumberChange={(val) => handleUpdateInvoice('invoiceNumber', val)}
              invoiceDate={invoice?.invoiceDate || ''}
              onInvoiceDateChange={(val) => handleUpdateInvoice('invoiceDate', val)}
            />
            <div className="flex items-center gap-2">
                {isSaving && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                <InvoiceActions onSave={handleSaveInvoice} />
            </div>
          </div>

          <Separator className="my-6 print:my-2" />

          <div className="grid md:grid-cols-2 gap-8 mb-8 print:mb-4">
            <div className="space-y-2">
              <Label htmlFor="customerName" className="font-headline">Bill To</Label>
              <div className="flex flex-col gap-2">
                <Input 
                    id="customerName" 
                    value={invoice?.customerName || ''} 
                    onChange={(e) => handleUpdateInvoice('customerName', e.target.value)} 
                    placeholder="Customer Name" 
                    className="print-no-border font-medium" 
                />
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <Table className="invoice-table">
              <TableHeader className="print:table-header-group">
                <TableRow>
                  <TableHead className="w-[60px] print:w-[40px]">Item</TableHead>
                  <TableHead className="w-[40%]">Description</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead className="text-right">Rate (Rs)</TableHead>
                  <TableHead className="text-right hidden md:table-cell print:table-cell">Amount (Rs)</TableHead>
                  <TableHead className="text-right">Tax (%)</TableHead>
                  <TableHead className="text-right">Total (Rs)</TableHead>
                  <TableHead className="print:hidden"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lineItems && lineItems.map((item, index) => {
                  const quantityAsString = String(item.quantity);
                  const quantityMatch = quantityAsString.match(/^[0-9.]+/);
                  const quantityAsNumber = quantityMatch ? parseFloat(quantityMatch[0]) : 1;
                  const quantity = isNaN(quantityAsNumber) ? 1 : quantityAsNumber;

                  let amount = 0;
                  if (item.description === 'Labor cost') {
                      amount = item.rate;
                  } else {
                      amount = quantity * item.rate;
                  }
                  
                  const total = amount * (1 + item.tax / 100);
                  return (
                    <TableRow key={item.id}>
                      <TableCell className="text-muted-foreground font-medium text-xs">{index + 1}</TableCell>
                      <TableCell><Input value={item.description} onChange={(e) => handleUpdateLineItem(item.id, 'description', e.target.value)} className="w-full print-no-border" /></TableCell>
                      <TableCell><Input value={item.quantity} onChange={(e) => handleUpdateLineItem(item.id, 'quantity', e.target.value)} className="w-12 sm:w-20 text-right print-no-border" /></TableCell>
                      <TableCell><Input type="number" value={item.rate} onChange={(e) => handleUpdateLineItem(item.id, 'rate', e.target.value)} className="w-20 sm:w-28 text-right print-no-border" /></TableCell>
                      <TableCell className="text-right hidden md:table-cell print:table-cell">{formatCurrency(amount).replace('Rs ', '')}</TableCell>
                      <TableCell><Input type="number" value={item.tax} onChange={(e) => handleUpdateLineItem(item.id, 'tax', e.target.value)} className="w-16 sm:w-20 text-right print-no-border" /></TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(total).replace('Rs ', '')}</TableCell>
                      <TableCell className="print:hidden"><Button variant="ghost" size="icon" onClick={() => handleRemoveLineItem(item.id)}><Trash2 className="h-4 w-4 text-muted-foreground" /></Button></TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          <Button onClick={handleAddLineItem} variant="outline" className="mt-4 print:hidden">
            <Plus className="mr-2 h-4 w-4" /> Add Item
          </Button>

          <div className="invoice-totals-area flex justify-end">
            <div className="w-full md:w-1/2 lg:w-1/3 space-y-2 print:space-y-1 text-sm print:text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal:</span>
                <span className="font-medium">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tax:</span>
                <span className="font-medium">{formatCurrency(taxTotal)}</span>
              </div>
              <Separator className="print:my-1" />
              <div className="flex justify-between font-bold text-lg print:text-sm font-headline">
                <span>Grand Total:</span>
                <span>{formatCurrency(grandTotal)}</span>
              </div>
            </div>
          </div>
          
          <div className="signature-area mt-12 print:mt-4">
            <div className="relative h-20 w-40 print:h-12 print:w-32">
              <Image
                src="https://picsum.photos/seed/sig/160/80"
                alt="Authorized Signature"
                width={160}
                height={80}
                className="object-contain"
                data-ai-hint="signature"
              />
            </div>
            <p className="font-headline text-sm print:text-xs text-muted-foreground pt-2 border-t-2 border-dashed w-40 print:w-32">Authorized Signature</p>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
