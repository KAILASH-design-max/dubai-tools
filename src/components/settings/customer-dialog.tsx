"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { useFirestore, addDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import type { Customer } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

interface CustomerDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  userId: string;
  customer: Customer | null;
}

const initialFormData: Partial<Customer> = {
  name: '',
  email: '',
  phoneNumbers: [],
  addressLine1: '',
};

export function CustomerDialog({ isOpen, setIsOpen, userId, customer }: CustomerDialogProps) {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [formData, setFormData] = useState<Partial<Customer>>(initialFormData);

  useEffect(() => {
    if (customer) {
      setFormData(customer);
    } else {
      setFormData(initialFormData);
    }
  }, [customer, isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };
  
  const handlePhoneNumbersChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setFormData(prev => ({ ...prev, phoneNumbers: value.split(',').map(phone => phone.trim()) }));
  }

  const handleSave = () => {
    if (!firestore || !formData.name) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Customer name is required.",
      });
      return;
    }

    const customersCollectionRef = collection(firestore, `users/${userId}/customers`);

    if (customer?.id) {
      // Update existing customer
      const customerDocRef = doc(customersCollectionRef, customer.id);
      updateDocumentNonBlocking(customerDocRef, {
          ...formData,
          updatedAt: new Date().toISOString(),
      });
      toast({
        title: "Customer Updated",
        description: "The customer information has been updated.",
      });
    } else {
      // Add new customer
      addDocumentNonBlocking(customersCollectionRef, {
        ...formData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      toast({
        title: "Customer Added",
        description: "The new customer has been saved.",
      });
    }
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{customer ? 'Edit Customer' : 'Add New Customer'}</DialogTitle>
          <DialogDescription>
            {customer ? 'Update the details for this customer.' : 'Enter the details for the new customer.'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Customer Name</Label>
            <Input id="name" value={formData.name || ''} onChange={handleInputChange} />
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
            <Label htmlFor="addressLine1">Address</Label>
            <Input id="addressLine1" value={formData.addressLine1 || ''} onChange={handleInputChange} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
