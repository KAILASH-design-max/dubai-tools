
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
import { Landmark, Package, Tag } from 'lucide-react';

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
  category: '',
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
    if (!firestore || !formData.name) {
      toast({ variant: "destructive", title: "Missing Information", description: "Product name is required." });
      return;
    }

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
      toast({ title: "Inventory Updated", description: `${formData.name} record successfully modified.` });
    } else {
      addDocumentNonBlocking(inventoryCollection, {
        ...data,
        createdAt: new Date().toISOString(),
      });
      toast({ title: "Item Added", description: `${formData.name} is now tracked in your inventory.` });
    }

    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            {item ? 'Edit Product Record' : 'Onboard New Supply'}
          </DialogTitle>
          <DialogDescription>
            Enter precise technical details and pricing. Correct valuation helps in profit analysis.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Product Name</Label>
              <Input 
                id="name" 
                value={formData.name || ''} 
                onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                placeholder="e.g. Copper Wire 1.5mm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sku">SKU / Model No.</Label>
              <Input 
                id="sku" 
                value={formData.sku || ''} 
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })} 
                placeholder="Unique internal code"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category" className="flex items-center gap-2">
                <Tag className="h-3 w-3" />
                Category
              </Label>
              <Input 
                id="category" 
                value={formData.category || ''} 
                onChange={(e) => setFormData({ ...formData, category: e.target.value })} 
                placeholder="e.g. Wiring, Fixtures, Tools"
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2">Measurement Unit</Label>
              <Select 
                value={formData.unit || 'pcs'} 
                onValueChange={(val: any) => setFormData({ ...formData, unit: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select unit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pcs">Pieces (Pcs)</SelectItem>
                  <SelectItem value="mtr">Meters (Mtr)</SelectItem>
                  <SelectItem value="box">Box</SelectItem>
                  <SelectItem value="set">Set</SelectItem>
                  <SelectItem value="kg">Kilogram (Kg)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 bg-muted/30 p-4 rounded-lg border border-dashed">
            <div className="space-y-2">
              <Label htmlFor="quantity">Current Stock</Label>
              <Input 
                id="quantity" 
                type="number"
                value={formData.quantity ?? 0} 
                onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })} 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="minStock">Min Level</Label>
              <Input 
                id="minStock" 
                type="number"
                className="border-orange-200 focus-visible:ring-orange-200"
                value={formData.minStockLevel ?? 0} 
                onChange={(e) => setFormData({ ...formData, minStockLevel: Number(e.target.value) })} 
              />
            </div>
            <div className="space-y-2">
              <Label className="opacity-0">Placeholder</Label>
              <p className="text-[10px] text-muted-foreground leading-tight">System alerts you when stock hits min level.</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="purchasePrice" className="flex items-center gap-2">
                <Landmark className="h-3 w-3 text-muted-foreground" />
                Purchase Price (Rs)
              </Label>
              <Input 
                id="purchasePrice" 
                type="number"
                value={formData.purchasePrice ?? 0} 
                onChange={(e) => setFormData({ ...formData, purchasePrice: Number(e.target.value) })} 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sellingPrice" className="font-bold text-primary">Selling Rate (Rs)</Label>
              <Input 
                id="sellingPrice" 
                type="number"
                className="font-bold border-primary/30"
                value={formData.sellingPrice ?? 0} 
                onChange={(e) => setFormData({ ...formData, sellingPrice: Number(e.target.value) })} 
              />
            </div>
          </div>
        </div>
        <DialogFooter className="bg-muted/20 -mx-6 -mb-6 p-6 border-t">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Discard</Button>
          <Button onClick={handleSave} className="px-8 shadow-md">
            {item ? 'Commit Changes' : 'Finalize Addition'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
