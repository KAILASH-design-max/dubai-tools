
'use client';

import { useState } from 'react';
import { useFirestore, useCollection, useMemoFirebase, deleteDocumentNonBlocking } from '@/firebase';
import { collection, doc, query, orderBy } from 'firebase/firestore';
import { Service } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash2, Zap } from 'lucide-react';
import { ServiceDialog } from './service-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export function ServiceList({ userId }: { userId: string }) {
  const firestore = useFirestore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  const servicesCollectionRef = useMemoFirebase(
    () => (firestore ? collection(firestore, `users/${userId}/services`) : null),
    [firestore, userId]
  );

  const servicesQuery = useMemoFirebase(
    () => (servicesCollectionRef ? query(servicesCollectionRef, orderBy('name', 'asc')) : null),
    [servicesCollectionRef]
  );

  const { data: services, isLoading } = useCollection<Service>(servicesQuery);

  const handleAddNew = () => {
    setSelectedService(null);
    setDialogOpen(true);
  };

  const handleEdit = (service: Service) => {
    setSelectedService(service);
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (!firestore) return;
    if (window.confirm('Are you sure you want to delete this service from your catalog?')) {
      const docRef = doc(firestore, `users/${userId}/services/${id}`);
      deleteDocumentNonBlocking(docRef);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-xs text-muted-foreground italic">Standard labor tasks and fixed-price services.</p>
        <Button onClick={handleAddNew} size="sm">
          <Plus className="mr-2 h-4 w-4" /> Add Service
        </Button>
      </div>

      <div className="border rounded-md overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Service Name</TableHead>
              <TableHead className="text-right">Standard Rate</TableHead>
              <TableHead className="text-right">Tax (%)</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {services && services.length > 0 ? (
              services.map(service => (
                <TableRow key={service.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                        <Zap className="h-3 w-3 text-primary" />
                        {service.name}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-bold">Rs {service.rate.toLocaleString()}</TableCell>
                  <TableCell className="text-right">{service.tax}%</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(service)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(service.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
                  Your service catalog is empty. Add services like "Fan Installation" or "AC Service" here.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <ServiceDialog
        isOpen={dialogOpen}
        onOpenChange={setDialogOpen}
        userId={userId}
        service={selectedService}
      />
    </div>
  );
}
