
'use client';

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Laborer, LaborRecord } from '@/lib/types';
import { useFirestore } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { addDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase';
import { useToast } from '@/hooks/use-toast';

interface LaborRecordDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  record: LaborRecord | null;
  laborers: Laborer[];
  userId: string;
}

const initialFormData: Partial<LaborRecord> = {
  laborerId: '',
  laborerName: '',
  date: new Date().toISOString().split('T')[0],
  category: 'Full Day',
  workDescription: '',
  amount: 0,
  status: 'Pending',
};

export function LaborRecordDialog({ isOpen, onOpenChange, record, laborers, userId }: LaborRecordDialogProps) {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [formData, setFormData] = useState<Partial<LaborRecord>>(initialFormData);

  useEffect(() => {
    if (record) {
      setFormData(record);
    } else {
      setFormData({
        ...initialFormData,
        date: new Date().toISOString().split('T')[0]
      });
    }
  }, [record, isOpen]);

  const handleLaborerChange = (id: string) => {
    const laborer = laborers.find(l => l.id === id);
    if (laborer) {
      setFormData({
        ...formData,
        laborerId: id,
        laborerName: laborer.name,
        amount: laborer.dailyRate // Default to their standard rate for Full Day
      });
    }
  };

  const handleCategoryChange = (category: LaborRecord['category']) => {
    const laborer = laborers.find(l => l.id === formData.laborerId);
    let amount = formData.amount || 0;

    if (laborer) {
      if (category === 'Full Day') amount = laborer.dailyRate;
      else if (category === 'Half Day') amount = laborer.dailyRate / 2;
      else if (category === 'Advance') amount = 0; // Usually manual
    }

    setFormData({ ...formData, category, amount });
  };

  const handleSave = () => {
    if (!firestore || !formData.laborerId || !formData.date || !formData.category) {
      toast({ variant: "destructive", title: "Error", description: "Please fill in all required fields." });
      return;
    }

    const recordsCollection = collection(firestore, `users/${userId}/laborRecords`);
    
    const data = {
      ...formData,
      amount: Number(formData.amount) || 0,
      updatedAt: new Date().toISOString(),
    };

    if (record) {
      updateDocumentNonBlocking(doc(recordsCollection, record.id), data);
      toast({ title: "Record Updated", description: "Work record has been updated." });
    } else {
      addDocumentNonBlocking(recordsCollection, {
        ...data,
        createdAt: new Date().toISOString(),
      });
      toast({ title: "Record Added", description: "Daily work recorded successfully." });
    }

    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>{record ? 'Edit Work Record' : 'Record Daily Work'}</DialogTitle>
          <DialogDescription>
            Log daily tasks, overtime, or advance payments for your workers.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label>Select Laborer</Label>
            <Select 
              value={formData.laborerId || ''} 
              onValueChange={handleLaborerChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose a worker" />
              </SelectTrigger>
              <SelectContent>
                {laborers.map((l) => (
                  <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="date">Date</Label>
              <Input 
                id="date" 
                type="date"
                value={formData.date || ''} 
                onChange={(e) => setFormData({ ...formData, date: e.target.value })} 
              />
            </div>
            <div className="grid gap-2">
              <Label>Category</Label>
              <Select 
                value={formData.category || 'Full Day'} 
                onValueChange={(val: any) => handleCategoryChange(val)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Full Day">Full Day</SelectItem>
                  <SelectItem value="Half Day">Half Day</SelectItem>
                  <SelectItem value="Overtime">Overtime</SelectItem>
                  <SelectItem value="Advance">Advance Paid</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="amount">Amount (Rs)</Label>
              <Input 
                id="amount" 
                type="number"
                value={formData.amount ?? 0} 
                onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })} 
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <Select 
                value={formData.status || 'Pending'} 
                onValueChange={(val: any) => setFormData({ ...formData, status: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Paid">Paid</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="workDescription">Description (Optional)</Label>
            <Textarea 
              id="workDescription" 
              value={formData.workDescription || ''} 
              onChange={(e) => setFormData({ ...formData, workDescription: e.target.value })} 
              placeholder="e.g. Wiring for 3rd floor apartment"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave}>Save Record</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
