'use client';

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { InventoryItem } from '@/lib/types';
import { useFirestore } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { addDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase';
import { useToast } from '@/hooks/use-toast';

interface InventoryDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  item: InventoryItem | null;
  userId: string;
}

const initialFormData: Partial<InventoryItem> = {
  name: '',
  description: '',
  sku: '',
  quantity: 0,
  unit: 'pcs',
  purchasePrice: 0,
  sellingPrice: 0,
  minStockLevel: 0,
};

export function InventoryDialog({ isOpen, onOpenChange, item, userId }: InventoryDialogProps) {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [formData, setFormData] = useState<Partial<InventoryItem>>(initialFormData);

  useEffect(() => {
    if (item) {
      setFormData(item);
    } else {
      setFormData(initialFormData);
    }
  }, [item, isOpen]);

  const handleSave = () => {
    if (!firestore || !formData.name) return;

    const inventoryCollection = collection(firestore, `users/${userId}/inventory`);
    
    const data = {
      ...formData,
      quantity: Number(formData.quantity) || 0,
      purchasePrice: Number(formData.purchasePrice) || 0,
      sellingPrice: Number(formData.sellingPrice) || 0,
      minStockLevel: Number(formData.minStockLevel) || 0,
      updatedAt: new Date().toISOString(),
    };

    if (item) {
      updateDocumentNonBlocking(doc(inventoryCollection, item.id), data);
      toast({ title: "Item Updated", description: `${formData.name} stock has been updated.` });
    } else {
      addDocumentNonBlocking(inventoryCollection, {
        ...data,
        createdAt: new Date().toISOString(),
      });
      toast({ title: "Item Added", description: `${formData.name} added to inventory.` });
    }

    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{item ? 'Edit Item' : 'Add New Inventory Item'}</DialogTitle>
          <DialogDescription>
            Enter details for your electrical item. Set minimum stock level for alerts.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">Name</Label>
            <Input 
              id="name" 
              className="col-span-3" 
              value={formData.name || ''} 
              onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
              placeholder="e.g. Copper Wire 1.5mm"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="sku" className="text-right">SKU/Code</Label>
            <Input 
              id="sku" 
              className="col-span-3" 
              value={formData.sku || ''} 
              onChange={(e) => setFormData({ ...formData, sku: e.target.value })} 
              placeholder="Internal product code"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="quantity" className="text-right">Stock</Label>
              <Input 
                id="quantity" 
                type="number"
                className="col-span-3" 
                value={formData.quantity ?? 0} 
                onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })} 
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Unit</Label>
              <Select 
                value={formData.unit || 'pcs'} 
                onValueChange={(val: any) => setFormData({ ...formData, unit: val })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Unit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pcs">Pcs</SelectItem>
                  <SelectItem value="mtr">Mtr</SelectItem>
                  <SelectItem value="box">Box</SelectItem>
                  <SelectItem value="set">Set</SelectItem>
                  <SelectItem value="kg">Kg</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="purchasePrice" className="text-right">Purchase</Label>
              <Input 
                id="purchasePrice" 
                type="number"
                className="col-span-3" 
                value={formData.purchasePrice ?? 0} 
                onChange={(e) => setFormData({ ...formData, purchasePrice: Number(e.target.value) })} 
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="sellingPrice" className="text-right">Selling</Label>
              <Input 
                id="sellingPrice" 
                type="number"
                className="col-span-3" 
                value={formData.sellingPrice ?? 0} 
                onChange={(e) => setFormData({ ...formData, sellingPrice: Number(e.target.value) })} 
              />
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="minStock" className="text-right">Min Stock</Label>
            <Input 
              id="minStock" 
              type="number"
              className="col-span-3" 
              value={formData.minStockLevel ?? 0} 
              onChange={(e) => setFormData({ ...formData, minStockLevel: Number(e.target.value) })} 
              placeholder="Alert level"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave}>Save Item</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
