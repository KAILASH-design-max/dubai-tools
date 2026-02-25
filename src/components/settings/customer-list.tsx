"use client";

import { useState } from 'react';
import { useFirestore, useCollection, useMemoFirebase, deleteDocumentNonBlocking } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import type { Customer } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { CustomerDialog } from './customer-dialog';
import { Skeleton } from '@/components/ui/skeleton';

export function CustomerList({ userId }: { userId: string }) {
  const firestore = useFirestore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const customersCollectionRef = useMemoFirebase(
    () => firestore ? collection(firestore, `users/${userId}/customers`) : null,
    [firestore, userId]
  );

  const { data: customers, isLoading } = useCollection<Customer>(customersCollectionRef);

  const handleAddNew = () => {
    setSelectedCustomer(null);
    setDialogOpen(true);
  };

  const handleEdit = (customer: Customer) => {
    setSelectedCustomer(customer);
    setDialogOpen(true);
  };

  const handleDelete = (customerId: string) => {
    if (!customersCollectionRef) return;
    if (window.confirm('Are you sure you want to delete this customer?')) {
      const customerDocRef = doc(customersCollectionRef, customerId);
      deleteDocumentNonBlocking(customerDocRef);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={handleAddNew}>
          <Plus className="mr-2" /> Add Customer
        </Button>
      </div>

      <div className="space-y-2">
        {customers && customers.length > 0 ? (
          customers.map(customer => (
            <div key={customer.id} className="flex items-center justify-between rounded-md border p-4">
              <div>
                <p className="font-medium">{customer.name}</p>
                <p className="text-sm text-muted-foreground">{customer.email}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" onClick={() => handleEdit(customer)}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(customer.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))
        ) : (
          <p className="text-center text-muted-foreground py-4">No customers found. Add one to get started.</p>
        )}
      </div>

      <CustomerDialog
        isOpen={dialogOpen}
        setIsOpen={setDialogOpen}
        userId={userId}
        customer={selectedCustomer}
      />
    </div>
  );
}
