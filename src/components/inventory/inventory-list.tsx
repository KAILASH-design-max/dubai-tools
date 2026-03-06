
'use client';

import { InventoryItem } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useFirestore } from '@/firebase';
import { doc } from 'firebase/firestore';
import { deleteDocumentNonBlocking } from '@/firebase';

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
    if (confirm('Are you sure you want to delete this item?')) {
      deleteDocumentNonBlocking(doc(firestore, `users/${userId}/inventory/${id}`));
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No inventory items found. Add your first item to get started.
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Item Name</TableHead>
          <TableHead>SKU</TableHead>
          <TableHead className="text-right">Stock</TableHead>
          <TableHead className="text-right">Rate</TableHead>
          <TableHead className="text-right">Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => {
          const isLowStock = item.minStockLevel !== undefined && item.quantity <= item.minStockLevel;
          
          return (
            <TableRow key={item.id} className={isLowStock ? "bg-orange-50/50 dark:bg-orange-950/20" : ""}>
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                  {isLowStock && <AlertTriangle className="h-4 w-4 text-orange-500" />}
                  {item.name}
                </div>
              </TableCell>
              <TableCell className="text-muted-foreground">{item.sku || '-'}</TableCell>
              <TableCell className="text-right">
                {item.quantity} {item.unit}
              </TableCell>
              <TableCell className="text-right font-medium">
                Rs {item.sellingPrice.toLocaleString()}
              </TableCell>
              <TableCell className="text-right">
                {isLowStock ? (
                  <Badge variant="destructive">Low Stock</Badge>
                ) : (
                  <Badge variant="outline" className="text-green-600 border-green-200">In Stock</Badge>
                )}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" size="icon" onClick={() => onEdit(item)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(item.id)}>
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
