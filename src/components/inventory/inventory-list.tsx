
'use client';

import { InventoryItem } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, AlertTriangle, Package, Tag, ArrowRight } from 'lucide-react';
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
    <Table>
      <TableHeader>
        <TableRow className="bg-muted/20 hover:bg-muted/20">
          <TableHead className="w-[300px]">Product Details</TableHead>
          <TableHead className="hidden md:table-cell">Category</TableHead>
          <TableHead className="text-right">Available Stock</TableHead>
          <TableHead className="text-right">Unit Rate</TableHead>
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
              "group transition-colors",
              isLowStock ? "bg-orange-50/30 hover:bg-orange-50/50" : "hover:bg-muted/10"
            )}>
              <TableCell className="py-4">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-foreground">{item.name}</span>
                    {isLowStock && <AlertTriangle className="h-3 w-3 text-orange-500" />}
                  </div>
                  <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
                    <span>SKU: {item.sku || 'N/A'}</span>
                    {item.purchasePrice !== undefined && (
                      <span className="text-green-600 bg-green-50 px-1.5 rounded">
                        +{marginPercent}% Margin
                      </span>
                    )}
                  </div>
                </div>
              </TableCell>
              <TableCell className="hidden md:table-cell">
                {item.category ? (
                  <Badge variant="secondary" className="font-medium text-[10px] uppercase">
                    <Tag className="mr-1 h-3 w-3 opacity-50" />
                    {item.category}
                  </Badge>
                ) : (
                  <span className="text-muted-foreground text-xs italic">Uncategorized</span>
                )}
              </TableCell>
              <TableCell className="text-right py-4">
                <div className="flex flex-col items-end">
                  <span className={cn("font-bold", isLowStock ? "text-orange-600" : "text-foreground")}>
                    {item.quantity} {item.unit}
                  </span>
                  <span className="text-[10px] text-muted-foreground">Min Level: {item.minStockLevel || 0}</span>
                </div>
              </TableCell>
              <TableCell className="text-right py-4">
                <div className="flex flex-col items-end">
                  <span className="font-bold text-primary">{formatCurrency(item.sellingPrice)}</span>
                  <span className="text-[10px] text-muted-foreground">Cost: {formatCurrency(item.purchasePrice || 0)}</span>
                </div>
              </TableCell>
              <TableCell className="text-right py-4">
                {isLowStock ? (
                  <Badge variant="destructive" className="animate-pulse">REORDER</Badge>
                ) : (
                  <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50/50">OPTIMAL</Badge>
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
  );
}
