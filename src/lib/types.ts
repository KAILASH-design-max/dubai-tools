
export interface CompanyProfile {
    id: string;
    name: string;
    addressLine1: string;
    addressLine2?: string;
    phoneNumbers: string[];
    email: string;
    gstRegistrationNumber: string;
    defaultInvoiceNotes?: string;
}

export interface UserProfile {
    fullName: string;
    phoneNumber: string;
    email: string;
}

export interface Customer {
    id: string;
    name: string;
    contactPerson?: string;
    email: string;
    phoneNumbers: string[];
    addressLine1: string;
    addressLine2?: string;
    gstRegistrationNumber?: string;
    createdAt: string; 
    updatedAt: string; 
}

export interface InventoryItem {
    id: string;
    name: string;
    description?: string;
    sku?: string;
    quantity: number;
    unit: 'pcs' | 'mtr' | 'box' | 'set' | 'kg';
    purchasePrice?: number;
    sellingPrice: number;
    minStockLevel?: number;
    createdAt: string;
    updatedAt: string;
}

export interface Laborer {
    id: string;
    name: string;
    phone?: string;
    dailyRate: number;
    joiningDate: string;
    createdAt: string;
    updatedAt: string;
}

export interface LaborRecord {
    id: string;
    laborerId: string;
    laborerName: string;
    date: string;
    workDescription?: string;
    amount: number;
    status: 'Paid' | 'Pending';
    createdAt: string;
    updatedAt: string;
}

export interface Invoice {
    id: string;
    invoiceNumber: string;
    invoiceDate: string; 
    customerId: string;
    customerName: string;
    customerPhone?: string;
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
    sortIndex: number;
}
