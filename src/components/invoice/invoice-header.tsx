"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CompanyProfile } from "@/lib/types";

type InvoiceHeaderProps = {
    invoiceNumber: string;
    onInvoiceNumberChange: (value: string) => void;
    invoiceDate: string;
    onInvoiceDateChange: (value: string) => void;
    companyProfile: CompanyProfile | null;
};

export function InvoiceHeader({ 
    invoiceNumber, onInvoiceNumberChange, 
    invoiceDate, onInvoiceDateChange,
    companyProfile
}: InvoiceHeaderProps) {
  // Use provided business defaults as fallback
  const displayProfile = companyProfile || {
    name: 'DUBAI TOOLS',
    addressLine1: 'Shivdhara, Darbhanga, Bihar 846005',
    city: 'Darbhanga',
    state: 'Bihar',
    postalCode: '846005',
    phoneNumbers: ['9268863031', '7280944150'],
    email: 'dubaitools2026@gmail.com',
    gstRegistrationNumber: 'Qw1234766666s',
  };

  return (
    <div className="font-body grid sm:grid-cols-2 gap-4 w-full">
      <div className="space-y-2">
          <div className="space-y-1">
            <h1 className="font-headline text-xl sm:text-2xl font-bold text-primary">
              {displayProfile.name}
            </h1>
            <div className="not-italic text-muted-foreground text-sm space-y-1">
                <p>{displayProfile.addressLine1}</p>
                <p>{displayProfile.city}{displayProfile.state ? `, ${displayProfile.state}` : ''} {displayProfile.postalCode}</p>
                {displayProfile.phoneNumbers && displayProfile.phoneNumbers.length > 0 && (
                  <div className="flex items-center gap-1">
                      <span className="font-bold">Phone:</span>
                      <span>{displayProfile.phoneNumbers.join(', ')}</span>
                  </div>
                )}
                {displayProfile.email && (
                  <div className="flex items-center gap-1">
                      <span className="font-bold">Email:</span>
                      <span>{displayProfile.email}</span>
                  </div>
                )}
                {displayProfile.gstRegistrationNumber && (
                  <div className="flex items-center gap-1">
                      <span className="font-bold">GST:</span>
                      <span>{displayProfile.gstRegistrationNumber}</span>
                  </div>
                )}
            </div>
          </div>
      </div>
      <div className="space-y-4 text-sm sm:text-right">
          <div className="grid grid-cols-2 sm:grid-cols-[1fr_auto] items-center gap-2">
              <Label htmlFor="invoiceNumber" className="sm:text-right">Invoice</Label>
              <Input id="invoiceNumber" value={invoiceNumber} onChange={(e) => onInvoiceNumberChange(e.target.value)} className="sm:max-w-[150px] print-no-border" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-[1fr_auto] items-center gap-2">
              <Label htmlFor="invoiceDate" className="sm:text-right">Invoice Date</Label>
              <Input id="invoiceDate" type="date" value={invoiceDate} onChange={(e) => onInvoiceDateChange(e.target.value)} className="sm:max-w-[150px] print-no-border hide-calendar-icon" />
          </div>
      </div>
    </div>
  );
}
