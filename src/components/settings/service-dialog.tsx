
'use client';

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Service } from '@/lib/types';
import { useFirestore } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { addDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase';
import { useToast } from '@/hooks/use-toast';

interface ServiceDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  service: Service | null;
  userId: string;
}

const initialFormData: Partial<Service> = {
  name: '',
  description: '',
  rate: 0,
  tax: 0,
};

export function ServiceDialog({ isOpen, onOpenChange, service, userId }: ServiceDialogProps) {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [formData, setFormData] = useState<Partial<Service>>(initialFormData);

  useEffect(() => {
    if (service) {
      setFormData(service);
    } else {
      setFormData(initialFormData);
    }
  }, [service, isOpen]);

  const handleSave = () => {
    if (!firestore || !formData.name) {
      toast({ variant: "destructive", title: "Error", description: "Service name is required." });
      return;
    }

    const servicesCollection = collection(firestore, `users/${userId}/services`);
    
    const data = {
      ...formData,
      rate: Number(formData.rate) || 0,
      tax: Number(formData.tax) || 0,
      updatedAt: new Date().toISOString(),
    };

    if (service) {
      updateDocumentNonBlocking(doc(servicesCollection, service.id), data);
      toast({ title: "Service Updated", description: `${formData.name} has been updated in your catalog.` });
    } else {
      addDocumentNonBlocking(servicesCollection, {
        ...data,
        createdAt: new Date().toISOString(),
      });
      toast({ title: "Service Added", description: `${formData.name} added to your catalog.` });
    }

    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>{service ? 'Edit Service' : 'Add New Service'}</DialogTitle>
          <DialogDescription>
            Define a standard task or service rate for your catalog.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Service Name</Label>
            <Input 
              id="name" 
              value={formData.name || ''} 
              onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
              placeholder="e.g. Standard Fan Repair"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="rate">Standard Rate (Rs)</Label>
              <Input 
                id="rate" 
                type="number"
                value={formData.rate ?? 0} 
                onChange={(e) => setFormData({ ...formData, rate: Number(e.target.value) })} 
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="tax">Default Tax (%)</Label>
              <Input 
                id="tax" 
                type="number"
                value={formData.tax ?? 0} 
                onChange={(e) => setFormData({ ...formData, tax: Number(e.target.value) })} 
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea 
              id="description" 
              value={formData.description || ''} 
              onChange={(e) => setFormData({ ...formData, description: e.target.value })} 
              placeholder="Briefly describe what this service covers..."
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave}>Save Service</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
