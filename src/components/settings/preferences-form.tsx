"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useFirestore, useMemoFirebase, setDocumentNonBlocking, useDoc } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '../ui/skeleton';
import { Separator } from '../ui/separator';
import { Landmark, Hash } from 'lucide-react';

export function PreferencesForm({ userId }: { userId: string }) {
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const prefsRef = useMemoFirebase(
    () => firestore ? doc(firestore, `users/${userId}/profile/preferences`) : null,
    [firestore, userId]
  );
  
  const { data: prefs, isLoading } = useDoc(prefsRef);
  const [formData, setFormData] = useState({
    defaultTaxRate: 0,
    authorizedSignatory: '',
    currency: 'INR',
    lowStockThreshold: 5,
    invoicePrefix: 'INV-',
    bankName: '',
    accountNumber: '',
    ifscCode: '',
  });

  useEffect(() => {
    if (prefs) {
      setFormData({
        defaultTaxRate: prefs.defaultTaxRate ?? 0,
        authorizedSignatory: prefs.authorizedSignatory ?? '',
        currency: prefs.currency ?? 'INR',
        lowStockThreshold: prefs.lowStockThreshold ?? 5,
        invoicePrefix: prefs.invoicePrefix ?? 'INV-',
        bankName: prefs.bankName ?? '',
        accountNumber: prefs.accountNumber ?? '',
        ifscCode: prefs.ifscCode ?? '',
      });
    }
  }, [prefs]);

  const handleSave = () => {
    if (prefsRef) {
      setDocumentNonBlocking(prefsRef, {
        ...formData,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
      
      toast({
        title: "Preferences Saved",
        description: "Your global defaults and bank details have been updated.",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="defaultTaxRate">Default Tax Rate (%)</Label>
          <Input 
            id="defaultTaxRate" 
            type="number" 
            value={formData.defaultTaxRate} 
            onChange={(e) => setFormData({ ...formData, defaultTaxRate: parseFloat(e.target.value) || 0 })} 
          />
          <p className="text-[10px] text-muted-foreground">Automatically applied to new invoice items.</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="currency">Currency Code</Label>
          <Input 
            id="currency" 
            value={formData.currency} 
            onChange={(e) => setFormData({ ...formData, currency: e.target.value })} 
          />
          <p className="text-[10px] text-muted-foreground">e.g., INR, USD, AED</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="invoicePrefix" className="flex items-center gap-2">
            <Hash className="h-3 w-3" />
            Invoice Number Prefix
          </Label>
          <Input 
            id="invoicePrefix" 
            value={formData.invoicePrefix} 
            onChange={(e) => setFormData({ ...formData, invoicePrefix: e.target.value })} 
            placeholder="e.g. DT-"
          />
          <p className="text-[10px] text-muted-foreground">Prefix for automatically generated invoice numbers.</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="lowStockThreshold">Low Stock Alert Threshold</Label>
          <Input 
            id="lowStockThreshold" 
            type="number" 
            value={formData.lowStockThreshold} 
            onChange={(e) => setFormData({ ...formData, lowStockThreshold: parseInt(e.target.value) || 0 })} 
          />
          <p className="text-[10px] text-muted-foreground">Alerts when items fall below this quantity.</p>
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        <h3 className="text-sm font-bold flex items-center gap-2">
          <Landmark className="h-4 w-4 text-primary" />
          Bank Payment Details
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="bankName">Bank Name</Label>
            <Input 
              id="bankName" 
              value={formData.bankName} 
              onChange={(e) => setFormData({ ...formData, bankName: e.target.value })} 
              placeholder="e.g. HDFC Bank"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="accountNumber">Account Number</Label>
            <Input 
              id="accountNumber" 
              value={formData.accountNumber} 
              onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })} 
              placeholder="Enter account number"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ifscCode">IFSC Code</Label>
            <Input 
              id="ifscCode" 
              value={formData.ifscCode} 
              onChange={(e) => setFormData({ ...formData, ifscCode: e.target.value })} 
              placeholder="e.g. HDFC0001234"
            />
          </div>
        </div>
        <p className="text-[10px] text-muted-foreground italic">Note: These details will be available for inclusion in your invoice notes.</p>
      </div>

      <Separator />

      <div className="space-y-2">
        <Label htmlFor="authorizedSignatory">Default Authorized Signatory</Label>
        <Input 
          id="authorizedSignatory" 
          value={formData.authorizedSignatory} 
          onChange={(e) => setFormData({ ...formData, authorizedSignatory: e.target.value })} 
          placeholder="e.g. Proprietor / Manager"
        />
        <p className="text-[10px] text-muted-foreground">Name that appears below the signature line on printed documents.</p>
      </div>

      <Button onClick={handleSave} className="w-full sm:w-auto">Save Preferences</Button>
    </div>
  );
}
