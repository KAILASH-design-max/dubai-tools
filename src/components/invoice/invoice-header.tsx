
"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CompanyProfile } from "@/lib/types";
import { Zap } from "lucide-react";

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
  const displayProfile = companyProfile || {
    name: 'DUBAI TOOLS',
    addressLine1: 'Shivdhara',
    phoneNumbers: ['9268863031', '7280944150'],
    email: 'dubaitools2026@gmail.com',
    gstRegistrationNumber: 'Qw1234766666s',
  };

  return (
    <div className="font-body grid sm:grid-cols-2 gap-2 w-full">
      <div className="space-y-1">
          <div className="space-y-0">
            <h1 className="font-headline text-xl sm:text-2xl font-bold text-primary flex items-center gap-2">
              <Zap className="h-6 w-6 shrink-0" />
              <span>{displayProfile.name}</span>
            </h1>
            <div className="not-italic text-muted-foreground text-xs sm:text-sm space-y-0 leading-tight">
                <p>{displayProfile.addressLine1}</p>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0 text-[10px] sm:text-xs">
                  {displayProfile.phoneNumbers && displayProfile.phoneNumbers.length > 0 && (
                    <div className="flex items-center gap-1">
                        <span className="font-bold">Ph:</span>
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
      </div>
      <div className="space-y-1 text-sm sm:text-right flex flex-col sm:items-end justify-center">
          <div className="grid grid-cols-2 sm:flex items-center gap-2">
              <Label htmlFor="invoiceNumber" className="sm:text-right text-xs">Invoice #</Label>
              <Input id="invoiceNumber" value={invoiceNumber} onChange={(e) => onInvoiceNumberChange(e.target.value)} className="h-7 sm:max-w-[120px] print-no-border text-xs" />
          </div>
          <div className="grid grid-cols-2 sm:flex items-center gap-2">
              <Label htmlFor="invoiceDate" className="sm:text-right text-xs">Date</Label>
              <Input id="invoiceDate" type="date" value={invoiceDate} onChange={(e) => onInvoiceDateChange(e.target.value)} className="h-7 sm:max-w-[120px] print-no-border hide-calendar-icon text-xs" />
          </div>
      </div>
    </div>
  );
}
