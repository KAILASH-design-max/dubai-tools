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
        defaultInvoiceNotes: '1. All payments should be made to Dubai Tools.\n2. Goods once sold will not be taken back or exchanged.\n3. Warranty claims are subject to manufacturer policy.',
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
        description: "Your company profile has been successfully updated.",
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
        <Label htmlFor="defaultInvoiceNotes">Default Invoice Terms / Notes</Label>
        <Textarea 
          id="defaultInvoiceNotes" 
          value={formData.defaultInvoiceNotes || ''} 
          onChange={handleInputChange} 
          placeholder="Enter terms, bank details, or payment instructions that will appear on every new invoice."
          className="min-h-[120px]"
        />
        <p className="text-xs text-muted-foreground">These notes will automatically load for every new invoice created.</p>
      </div>

      <Button onClick={handleSaveChanges} className="w-full sm:w-auto">Save Changes</Button>
    </div>
  );
}
