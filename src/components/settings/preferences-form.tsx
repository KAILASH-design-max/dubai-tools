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
  });

  useEffect(() => {
    if (prefs) {
      setFormData({
        defaultTaxRate: prefs.defaultTaxRate ?? 0,
        authorizedSignatory: prefs.authorizedSignatory ?? '',
        currency: prefs.currency ?? 'INR',
        lowStockThreshold: prefs.lowStockThreshold ?? 5,
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
        description: "Your global defaults have been updated.",
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

      <Separator />

      <div className="space-y-2">
        <Label htmlFor="authorizedSignatory">Default Authorized Signatory</Label>
        <Input 
          id="authorizedSignatory" 
          value={formData.authorizedSignatory} 
          onChange={(e) => setFormData({ ...formData, authorizedSignatory: e.target.value })} 
          placeholder="e.g. Proprietor / Manager"
        />
        <p className="text-[10px] text-muted-foreground">Name that appears below the signature line.</p>
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

      <Button onClick={handleSave} className="w-full sm:w-auto">Save Preferences</Button>
    </div>
  );
}
