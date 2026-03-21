
'use client';

import { InventoryItem } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, AlertTriangle, Package, Tag, MapPin, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useFirestore } from '@/firebase';
import { doc } from 'firebase/firestore';
import { deleteDocumentNonBlocking } from '@/firebase';
import { cn } from '@/lib/utils';

interface InventoryListProps {
  items: InventoryItem[];
  isLoading: boolean;
  onEdit: (item: InventoryItem) => void;
  userId: string;
}

export function InventoryList({ items, isLoading, onEdit, userId }: InventoryListProps) {
  const firestore = useFirestore();

  const handleDelete = (id: string) => {
    if (!firestore) return;
    if (confirm('Are you sure you want to delete this item? Historical invoices will not be affected.')) {
      deleteDocumentNonBlocking(doc(firestore, `users/${userId}/inventory/${id}`));
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-16 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-20 flex flex-col items-center gap-4 text-muted-foreground">
        <Package className="h-12 w-12 opacity-10" />
        <div className="space-y-1">
          <p className="font-bold">No stock matches found</p>
          <p className="text-sm">Try adjusting your filters or search terms.</p>
        </div>
      </div>
    );
  }

  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })
      .format(amount).replace('₹', 'Rs ');

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/20 hover:bg-muted/20">
            <TableHead className="w-[300px]">Product & Brand</TableHead>
            <TableHead className="hidden md:table-cell">Storage & Cat</TableHead>
            <TableHead className="text-right">Stock Level</TableHead>
            <TableHead className="text-right">Pricing</TableHead>
            <TableHead className="text-right">Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => {
            const isLowStock = item.minStockLevel !== undefined && item.quantity <= item.minStockLevel;
            const margin = item.sellingPrice - (item.purchasePrice || 0);
            const marginPercent = item.purchasePrice ? Math.round((margin / item.purchasePrice) * 100) : 0;
            
            return (
              <TableRow key={item.id} className={cn(
                "group transition-colors animate-in fade-in slide-in-from-top-1 duration-300",
                isLowStock ? "bg-orange-50/30 hover:bg-orange-50/50" : "hover:bg-muted/10"
              )}>
                <TableCell className="py-4">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-foreground">{item.name}</span>
                      {isLowStock && <AlertTriangle className="h-3 w-3 text-orange-500" />}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-wider font-bold">
                      <span className="bg-primary/10 text-primary px-1.5 rounded flex items-center gap-1">
                        <ShieldCheck className="h-2.5 w-2.5" />
                        {item.brand || 'No Brand'}
                      </span>
                      <span className="text-muted-foreground">SKU: {item.sku || 'N/A'}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <div className="flex flex-col gap-1.5">
                    {item.location && (
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-medium">
                        <MapPin className="h-3 w-3" />
                        {item.location}
                      </div>
                    )}
                    {item.category ? (
                      <Badge variant="secondary" className="w-fit font-medium text-[9px] uppercase px-1.5 py-0">
                        <Tag className="mr-1 h-2.5 w-2.5 opacity-50" />
                        {item.category}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-xs italic">Uncategorized</span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right py-4">
                  <div className="flex flex-col items-end">
                    <span className={cn("font-bold text-base", isLowStock ? "text-orange-600" : "text-foreground")}>
                      {item.quantity} {item.unit}
                    </span>
                    <span className="text-[10px] text-muted-foreground">Safety: {item.minStockLevel || 0}</span>
                  </div>
                </TableCell>
                <TableCell className="text-right py-4">
                  <div className="flex flex-col items-end">
                    <span className="font-bold text-primary">{formatCurrency(item.sellingPrice)}</span>
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-muted-foreground">Cost: {formatCurrency(item.purchasePrice || 0)}</span>
                      <span className="text-[9px] text-green-600 font-bold">+{marginPercent}%</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-right py-4">
                  {isLowStock ? (
                    <Badge variant="destructive" className="animate-pulse text-[9px]">REORDER</Badge>
                  ) : (
                    <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50/50 text-[9px]">OPTIMAL</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right py-4">
                  <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(item)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-destructive h-8 w-8 hover:bg-destructive/10" onClick={() => handleDelete(item.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
