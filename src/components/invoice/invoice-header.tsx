
"use client";

import { useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { CompanyProfile } from '@/lib/types';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
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
        addressLine1: 'Shivdhara, Darbharbhang, Bihar 846005',
        city: 'Darbharbhang',
        state: 'Bihar',
        postalCode: '846005',
        phoneNumbers: ['9268863031', '7280944150'],
        email: 'duubaitools2025@gmail.com',
        gstRegistrationNumber: '[Your GST Number]',
      };
      setDocumentNonBlocking(companyProfileRef, defaultProfile, { merge: false });
    }
  }, [isLoading, companyProfile, companyProfileRef]);

  return (
    <div className="font-body grid sm:grid-cols-2 gap-4 w-full">
      <div>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-64" />
            <Skeleton className="h-4 w-56" />
            <Skeleton className="h-4 w-60" />
            <Skeleton className="h-4 w-48" />
          </div>
        ) : companyProfile ? (
          <>
            <h1 className="font-headline text-xl sm:text-2xl font-bold text-primary">{companyProfile.name}</h1>
            <address className="not-italic text-muted-foreground text-sm space-y-1">
                <p>{companyProfile.addressLine1}, {companyProfile.city}, {companyProfile.state} {companyProfile.postalCode}</p>
                <p><strong>Phone:</strong> {companyProfile.phoneNumbers.join(', ')}</p>
                <p><strong>Email:</strong> {companyProfile.email}</p>
                <p><strong>GST / Reg. No.:</strong> {companyProfile.gstRegistrationNumber}</p>
            </address>
          </>
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
