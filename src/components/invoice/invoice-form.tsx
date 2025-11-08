"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Trash2, Plus } from 'lucide-react';
import { InvoiceHeader } from './invoice-header';
import { InvoiceActions } from './invoice-actions';
import { useToast } from "@/hooks/use-toast";

type LineItem = {
  id: number;
  description: string;
  quantity: number;
  rate: number;
  tax: number;
};

let nextId = 1;

export function InvoiceForm() {
  const { toast } = useToast();
  const [invoiceNumber, setInvoiceNumber] = useState("INV-001");
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [customerName, setCustomerName] = useState("Acme Corp");
  const [customerAddress, setCustomerAddress] = useState("123 Innovation Drive, Tech City");

  const [lineItems, setLineItems] = useState<LineItem[]>([
    { id: 0, description: "Pro Consulting Services", quantity: 10, rate: 150, tax: 18 },
  ]);

  const handleAddLineItem = () => {
    setLineItems([...lineItems, { id: nextId++, description: '', quantity: 1, rate: 0, tax: 0 }]);
  };

  const handleRemoveLineItem = (id: number) => {
    setLineItems(lineItems.filter(item => item.id !== id));
  };

  const handleUpdateLineItem = (id: number, field: keyof Omit<LineItem, 'id'>, value: string | number) => {
    const numericValue = typeof value === 'string' ? parseFloat(value) : value;
    setLineItems(lineItems.map(item =>
      item.id === id ? { ...item, [field]: field === 'description' ? value : (isNaN(numericValue) ? 0 : numericValue) } : item
    ));
  };
  
  const { subtotal, taxTotal, grandTotal } = lineItems.reduce((acc, item) => {
    const amount = item.quantity * item.rate;
    const taxAmount = amount * (item.tax / 100);
    acc.subtotal += amount;
    acc.taxTotal += taxAmount;
    acc.grandTotal += amount + taxAmount;
    return acc;
  }, { subtotal: 0, taxTotal: 0, grandTotal: 0 });
  
  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);

  return (
    <>
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .invoice-print-area, .invoice-print-area * { visibility: visible; }
          .invoice-print-area { position: absolute; left: 0; top: 0; width: 100%; }
        }
      `}</style>
      <Card className="max-w-4xl mx-auto invoice-print-area">
        <CardContent className="p-4 sm:p-6 md:p-8">
          <div className="flex flex-col-reverse sm:flex-row justify-between items-start gap-4 mb-6">
            <InvoiceHeader 
              invoiceNumber={invoiceNumber}
              onInvoiceNumberChange={setInvoiceNumber}
              invoiceDate={invoiceDate}
              onInvoiceDateChange={setInvoiceDate}
            />
            <InvoiceActions />
          </div>

          <Separator className="my-6" />

          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <div className="space-y-2">
              <Label htmlFor="customerName" className="font-headline">Bill To</Label>
              <Input id="customerName" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Customer Name" />
              <Input value={customerAddress} onChange={(e) => setCustomerAddress(e.target.value)} placeholder="Customer Address" />
            </div>
            <div className="space-y-4 text-sm">
                
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40%]">Item Description</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead className="text-right">Rate</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Tax (%)</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="print:hidden"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lineItems.map(item => {
                  const amount = item.quantity * item.rate;
                  const total = amount * (1 + item.tax / 100);
                  return (
                    <TableRow key={item.id}>
                      <TableCell><Input value={item.description} onChange={(e) => handleUpdateLineItem(item.id, 'description', e.target.value)} className="w-full" /></TableCell>
                      <TableCell><Input type="number" value={item.quantity} onChange={(e) => handleUpdateLineItem(item.id, 'quantity', e.target.value)} className="w-20 text-right" /></TableCell>
                      <TableCell><Input type="number" value={item.rate} onChange={(e) => handleUpdateLineItem(item.id, 'rate', e.target.value)} className="w-28 text-right" /></TableCell>
                      <TableCell className="text-right">{formatCurrency(amount)}</TableCell>
                      <TableCell><Input type="number" value={item.tax} onChange={(e) => handleUpdateLineItem(item.id, 'tax', e.target.value)} className="w-20 text-right" /></TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(total)}</TableCell>
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

          <Separator className="my-6" />

          <div className="flex justify-end">
            <div className="w-full md:w-1/2 lg:w-1/3 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal:</span>
                <span className="font-medium">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tax:</span>
                <span className="font-medium">{formatCurrency(taxTotal)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold text-lg font-headline">
                <span>Grand Total:</span>
                <span>{formatCurrency(grandTotal)}</span>
              </div>
            </div>
          </div>
          
          <div className="mt-12 text-muted-foreground">
            <p className="font-headline text-sm">Authorized Signature</p>
            <div className="mt-8 border-t-2 border-dashed w-1/3"></div>
          </div>

        </CardContent>
      </Card>
    </>
  );
}
