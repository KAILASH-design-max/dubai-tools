'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Laborer } from '@/lib/types';
import { useFirestore } from '@/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Loader2, CheckSquare, Users } from 'lucide-react';

interface QuickAttendanceDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  laborers: Laborer[];
  userId: string;
}

export function QuickAttendanceDialog({ isOpen, onOpenChange, laborers, userId }: QuickAttendanceDialogProps) {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const today = format(new Date(), 'yyyy-MM-dd');

  const toggleLaborer = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === laborers.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(laborers.map(l => l.id));
    }
  };

  const handleSave = async () => {
    if (!firestore || selectedIds.length === 0) return;

    setIsSubmitting(true);
    try {
      const recordsCollection = collection(firestore, `users/${userId}/laborRecords`);
      const now = new Date().toISOString();

      const promises = selectedIds.map(id => {
        const laborer = laborers.find(l => l.id === id);
        if (!laborer) return Promise.resolve();

        return addDoc(recordsCollection, {
          laborerId: laborer.id,
          laborerName: laborer.name,
          date: today,
          workDescription: 'Quick Attendance Log',
          amount: laborer.dailyRate,
          status: 'Pending',
          createdAt: now,
          updatedAt: now,
        });
      });

      await Promise.all(promises);
      toast({ title: "Attendance Logged", description: `Successfully logged work for ${selectedIds.length} workers.` });
      setSelectedIds([]);
      onOpenChange(false);
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: "Failed to log attendance." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckSquare className="h-5 w-5 text-primary" />
            Quick Attendance
          </DialogTitle>
          <DialogDescription>
            Select workers present today ({format(new Date(), 'PP')}). This will log a pending wage for each.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <div className="flex items-center justify-between mb-4 pb-2 border-b">
            <Label className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
              Worker Roster ({selectedIds.length}/{laborers.length})
            </Label>
            <Button variant="ghost" size="sm" onClick={handleSelectAll} className="h-7 text-xs">
              {selectedIds.length === laborers.length ? 'Deselect All' : 'Select All'}
            </Button>
          </div>
          
          <div className="max-h-[300px] overflow-y-auto space-y-1 px-1">
            {laborers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-8 w-8 mx-auto opacity-20 mb-2" />
                <p>No laborers found. Add them first.</p>
              </div>
            ) : laborers.map((laborer) => (
              <div 
                key={laborer.id} 
                className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => toggleLaborer(laborer.id)}
              >
                <Checkbox 
                  id={`laborer-${laborer.id}`} 
                  checked={selectedIds.includes(laborer.id)}
                  onCheckedChange={() => toggleLaborer(laborer.id)}
                  onClick={(e) => e.stopPropagation()}
                />
                <div className="flex-1 min-w-0">
                  <Label 
                    htmlFor={`laborer-${laborer.id}`} 
                    className="font-bold block cursor-pointer"
                  >
                    {laborer.name}
                  </Label>
                  <span className="text-xs text-muted-foreground">Daily Rate: Rs {laborer.dailyRate}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={isSubmitting || selectedIds.length === 0}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Logging...
              </>
            ) : `Log ${selectedIds.length} Present`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
