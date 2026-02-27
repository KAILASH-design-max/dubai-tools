"use client";

import { useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { CompanyProfile } from '@/lib/types';
import { setDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Skeleton } from '@/components/ui/skeleton';

type InvoiceHeaderProps = {
    userId: string;
    invoiceNumber: string;
    onInvoiceNumberChange: (value: string) => void;
    invoiceDate: string;
    onInvoiceDateChange: (value: string) => void;
};

export function InvoiceHeader({ 
    userId,
    invoiceNumber, onInvoiceNumberChange, 
    invoiceDate, onInvoiceDateChange 
}: InvoiceHeaderProps) {
  const firestore = useFirestore();
  const companyProfileId = 'main';

  const companyProfileRef = useMemoFirebase(
    () => firestore ? doc(firestore, `users/${userId}/companyProfile/${companyProfileId}`) : null,
    [firestore, userId]
  );
  
  const { data: companyProfile, isLoading } = useDoc<CompanyProfile>(companyProfileRef);

  useEffect(() => {
    if (!isLoading && !companyProfile && companyProfileRef) {
      const defaultProfile: Omit<CompanyProfile, 'id'> = {
        name: 'DUBAI TOOLS',
        addressLine1: 'Shivdhara, Darbhanga, Bihar 846005',
        city: 'Darbhanga',
        state: 'Bihar',
        postalCode: '846005',
        phoneNumbers: ['9268863031', '7280944150'],
        email: 'dubaitools2026@gmail.com',
        gstRegistrationNumber: '[Your GST Number]',
      };
      setDocumentNonBlocking(companyProfileRef, defaultProfile, { merge: false });
    }
  }, [isLoading, companyProfile, companyProfileRef]);

  const handleUpdateProfile = (field: keyof Omit<CompanyProfile, 'id'>, value: string) => {
    if (!companyProfileRef) return;
    if (field === 'phoneNumbers') {
        updateDocumentNonBlocking(companyProfileRef, { [field]: value.split(',').map(v => v.trim()) });
    } else {
        updateDocumentNonBlocking(companyProfileRef, { [field]: value });
    }
  };

  return (
    <div className="font-body grid sm:grid-cols-2 gap-4 w-full">
      <div className="space-y-2">
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-64" />
            <Skeleton className="h-4 w-56" />
            <Skeleton className="h-4 w-60" />
            <Skeleton className="h-4 w-48" />
          </div>
        ) : companyProfile ? (
          <div className="space-y-1">
            <Input 
                className="font-headline text-xl sm:text-2xl font-bold text-primary print-no-border h-auto p-0 border-none bg-transparent focus-visible:ring-0" 
                value={companyProfile.name} 
                onChange={(e) => handleUpdateProfile('name', e.target.value)}
            />
            <div className="not-italic text-muted-foreground text-sm space-y-1">
                <Input 
                    className="print-no-border h-auto p-0 border-none bg-transparent focus-visible:ring-0" 
                    value={companyProfile.addressLine1}
                    onChange={(e) => handleUpdateProfile('addressLine1', e.target.value)}
                    placeholder="Address Line 1"
                />
                <div className="flex gap-1">
                     <Input 
                        className="print-no-border h-auto p-0 border-none bg-transparent focus-visible:ring-0 w-24" 
                        value={companyProfile.city}
                        onChange={(e) => handleUpdateProfile('city', e.target.value)}
                        placeholder="City"
                    />
                    <span>,</span>
                     <Input 
                        className="print-no-border h-auto p-0 border-none bg-transparent focus-visible:ring-0 w-24" 
                        value={companyProfile.state}
                        onChange={(e) => handleUpdateProfile('state', e.target.value)}
                        placeholder="State"
                    />
                     <Input 
                        className="print-no-border h-auto p-0 border-none bg-transparent focus-visible:ring-0 w-20" 
                        value={companyProfile.postalCode}
                        onChange={(e) => handleUpdateProfile('postalCode', e.target.value)}
                        placeholder="Postal Code"
                    />
                </div>
                <div className="flex items-center gap-1">
                    <span className="font-bold shrink-0">Phone:</span>
                    <Input 
                        className="print-no-border h-auto p-0 border-none bg-transparent flex-1 focus-visible:ring-0" 
                        value={companyProfile.phoneNumbers.join(', ')}
                        onChange={(e) => handleUpdateProfile('phoneNumbers', e.target.value)}
                        placeholder="Phone numbers"
                    />
                </div>
                <div className="flex items-center gap-1">
                    <span className="font-bold shrink-0">Email:</span>
                    <Input 
                        className="print-no-border h-auto p-0 border-none bg-transparent flex-1 focus-visible:ring-0" 
                        value={companyProfile.email}
                        onChange={(e) => handleUpdateProfile('email', e.target.value)}
                        placeholder="Email"
                    />
                </div>
                <div className="flex items-center gap-1">
                    <span className="font-bold shrink-0">GST:</span>
                    <Input 
                        className="print-no-border h-auto p-0 border-none bg-transparent flex-1 focus-visible:ring-0" 
                        value={companyProfile.gstRegistrationNumber}
                        onChange={(e) => handleUpdateProfile('gstRegistrationNumber', e.target.value)}
                        placeholder="GST Registration Number"
                    />
                </div>
            </div>
          </div>
        ) : (
          <p>Company profile not found.</p>
        )}
      </div>
      <div className="space-y-4 text-sm sm:text-right">
          <div className="grid grid-cols-2 sm:grid-cols-[1fr_auto] items-center gap-2">
              <Label htmlFor="invoiceNumber" className="sm:text-right">Invoice #</Label>
              <Input id="invoiceNumber" value={invoiceNumber} onChange={(e) => onInvoiceNumberChange(e.target.value)} className="sm:max-w-[150px] print-no-border" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-[1fr_auto] items-center gap-2">
              <Label htmlFor="invoiceDate" className="sm:text-right">Invoice Date</Label>
              <Input id="invoiceDate" type="date" value={invoiceDate} onChange={(e) => onInvoiceDateChange(e.target.value)} className="sm:max-w-[150px] print-no-border" />
          </div>
      </div>
    </div>
  );
}
