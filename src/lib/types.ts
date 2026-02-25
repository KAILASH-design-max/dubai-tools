export interface CompanyProfile {
    id: string;
    name: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    postalCode: string;
    phoneNumbers: string[];
    email: string;
    gstRegistrationNumber: string;
    defaultInvoiceNotes?: string;
}

export interface Customer {
    id: string;
    name: string;
    contactPerson?: string;
    email: string;
    phoneNumbers: string[];
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    postalCode: string;
    gstRegistrationNumber?: string;
    createdAt: string; 
    updatedAt: string; 
}

export interface Invoice {
    id: string;
    invoiceNumber: string;
    invoiceDate: string; 
    customerId: string;
    customerName: string;
    companyProfileId: string;
    subtotalAmount: number;
    totalTaxAmount: number;
    grandTotalAmount: number;
    notes?: string;
    authorizedSignatureName?: string;
    status: 'Draft' | 'Sent' | 'Paid' | 'Overdue' | 'Cancelled';
    createdAt: string;
    updatedAt: string;
}

export interface InvoiceLineItem {
    id: string;
    description: string;
    quantity: string;
    rate: number;
    tax: number;
}
