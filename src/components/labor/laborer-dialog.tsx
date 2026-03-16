'use client';

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Laborer } from '@/lib/types';
import { useFirestore } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { addDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase';
import { useToast } from '@/hooks/use-toast';

interface LaborerDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  laborer: Laborer | null;
  userId: string;
}

const initialFormData: Partial<Laborer> = {
  name: '',
  phone: '',
  dailyRate: 0,
  joiningDate: new Date().toISOString().split('T')[0],
};

export function LaborerDialog({ isOpen, onOpenChange, laborer, userId }: LaborerDialogProps) {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [formData, setFormData] = useState<Partial<Laborer>>(initialFormData);

  useEffect(() => {
    if (laborer) {
      setFormData(laborer);
    } else {
      setFormData({
        ...initialFormData,
        joiningDate: new Date().toISOString().split('T')[0]
      });
    }
  }, [laborer, isOpen]);

  const handleSave = () => {
    if (!firestore || !formData.name) {
      toast({ variant: "destructive", title: "Error", description: "Name is required." });
      return;
    }

    const laborersCollection = collection(firestore, `users/${userId}/laborers`);
    
    const data = {
      ...formData,
      dailyRate: Number(formData.dailyRate) || 0,
      updatedAt: new Date().toISOString(),
    };

    if (laborer) {
      updateDocumentNonBlocking(doc(laborersCollection, laborer.id), data);
      toast({ title: "Laborer Updated", description: `${formData.name}'s profile updated.` });
    } else {
      addDocumentNonBlocking(laborersCollection, {
        ...data,
        createdAt: new Date().toISOString(),
      });
      toast({ title: "Laborer Added", description: `${formData.name} added to your team.` });
    }

    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>{laborer ? 'Edit Laborer' : 'Add New Laborer'}</DialogTitle>
          <DialogDescription>
            Enter details for your worker. Set their standard daily wage rate and joining date.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Full Name</Label>
            <Input 
              id="name" 
              value={formData.name || ''} 
              onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
              placeholder="e.g. Rajesh Kumar"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input 
              id="phone" 
              value={formData.phone || ''} 
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })} 
              placeholder="e.g. 9876543210"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="joiningDate">Joining Date</Label>
            <Input 
              id="joiningDate" 
              type="date"
              value={formData.joiningDate || ''} 
              onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })} 
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="dailyRate">Standard Daily Wage (Rs)</Label>
            <Input 
              id="dailyRate" 
              type="number"
              value={formData.dailyRate ?? 0} 
              onChange={(e) => setFormData({ ...formData, dailyRate: Number(e.target.value) })} 
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave}>Save Laborer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
