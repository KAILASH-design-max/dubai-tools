"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
        addressLine1: 'Shivdhara, Darbhanga, Bihar 846005',
        city: 'Darbhanga',
        state: 'Bihar',
        postalCode: '846005',
        phoneNumbers: ['9268863031', '7280944150'],
        email: 'dubaitools2026@gmail.com',
        gstRegistrationNumber: 'Qw1234766666s',
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
      <div className="space-y-2">
        <Label htmlFor="addressLine1">Address</Label>
        <Input id="addressLine1" value={formData.addressLine1 || ''} onChange={handleInputChange} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-2">
            <Label htmlFor="city">City</Label>
            <Input id="city" value={formData.city || ''} onChange={handleInputChange} />
        </div>
        <div className="space-y-2">
            <Label htmlFor="state">State</Label>
            <Input id="state" value={formData.state || ''} onChange={handleInputChange} />
        </div>
        <div className="space-y-2">
            <Label htmlFor="postalCode">Postal Code</Label>
            <Input id="postalCode" value={formData.postalCode || ''} onChange={handleInputChange} />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" value={formData.email || ''} onChange={handleInputChange} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="phoneNumbers">Phone Numbers</Label>
        <Input id="phoneNumbers" value={(formData.phoneNumbers || []).join(', ')} onChange={handlePhoneNumbersChange} />
        <p className="text-xs text-muted-foreground">Enter multiple phone numbers separated by commas.</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="gstRegistrationNumber">GST / Reg. No.</Label>
        <Input id="gstRegistrationNumber" value={formData.gstRegistrationNumber || ''} onChange={handleInputChange} />
      </div>

      <Button onClick={handleSaveChanges} className="w-full sm:w-auto">Save Changes</Button>
    </div>
  );
}
