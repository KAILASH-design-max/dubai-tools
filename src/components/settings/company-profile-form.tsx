"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useFirestore, useMemoFirebase, setDocumentNonBlocking, useCompanyProfile } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { CompanyProfile } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '../ui/skeleton';

const DEFAULT_TERMS = `1. All payments should be made in favor of DUBAI TOOLS.
2. Goods once sold will not be taken back or exchanged under any circumstances.
3. Any warranty claims must be directed to the respective manufacturer.
4. 18% p.a. interest will be charged if the bill is not paid within the due date.
5. All disputes are subject to local jurisdiction only.`;

export function CompanyProfileForm({ userId }: { userId: string }) {
  const firestore = useFirestore();
  const { toast } = useToast();
  const companyProfileId = 'main';

  const companyProfileRef = useMemoFirebase(
    () => firestore ? doc(firestore, `users/${userId}/companyProfile/${companyProfileId}`) : null,
    [firestore, userId]
  );
  
  const { data: companyProfile, isLoading } = useCompanyProfile(userId);

  const [formData, setFormData] = useState<Partial<CompanyProfile>>({});

  useEffect(() => {
    if (companyProfile) {
      setFormData(companyProfile);
    } else if (!isLoading && !companyProfile) {
      setFormData({
        name: 'DUBAI TOOLS',
        addressLine1: 'Shivdhara',
        phoneNumbers: ['9268863031', '7280944150'],
        email: 'dubaitools2026@gmail.com',
        gstRegistrationNumber: 'Qw1234766666s',
        defaultInvoiceNotes: DEFAULT_TERMS,
      });
    }
  }, [companyProfile, isLoading]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handlePhoneNumbersChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setFormData(prev => ({ ...prev, phoneNumbers: value.split(',').map(phone => phone.trim()) }));
  }

  const handleSaveChanges = () => {
    if (companyProfileRef) {
      setDocumentNonBlocking(companyProfileRef, formData, { merge: true });
      toast({
        title: "Profile Updated",
        description: "Your company profile and default terms have been successfully updated.",
      });
    }
  };
  
  if (isLoading) {
    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
            </div>
            <Skeleton className="h-10 w-32" />
        </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">Company Name</Label>
        <Input id="name" value={formData.name || ''} onChange={handleInputChange} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="addressLine1">Address Line 1</Label>
          <Input id="addressLine1" value={formData.addressLine1 || ''} onChange={handleInputChange} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="addressLine2">Address Line 2 (Optional)</Label>
          <Input id="addressLine2" value={formData.addressLine2 || ''} onChange={handleInputChange} />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" value={formData.email || ''} onChange={handleInputChange} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="gstRegistrationNumber">GST / Reg. No.</Label>
          <Input id="gstRegistrationNumber" value={formData.gstRegistrationNumber || ''} onChange={handleInputChange} />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="phoneNumbers">Phone Numbers</Label>
        <Input id="phoneNumbers" value={(formData.phoneNumbers || []).join(', ')} onChange={handlePhoneNumbersChange} />
        <p className="text-xs text-muted-foreground">Enter multiple phone numbers separated by commas.</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="defaultInvoiceNotes">Default Terms & Conditions</Label>
        <Textarea 
          id="defaultInvoiceNotes" 
          value={formData.defaultInvoiceNotes || ''} 
          onChange={handleInputChange} 
          placeholder="Enter terms, bank details, or payment instructions..."
          className="min-h-[150px]"
        />
        <p className="text-xs text-muted-foreground">These terms will automatically appear on every new invoice.</p>
      </div>

      <Button onClick={handleSaveChanges} className="w-full sm:w-auto">Save Business Profile</Button>
    </div>
  );
}
