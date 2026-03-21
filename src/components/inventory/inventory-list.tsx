
'use client';

import { InventoryItem } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, AlertTriangle, Package, Tag, MapPin, ShieldCheck, Plus, Minus, Truck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useFirestore } from '@/firebase';
import { doc } from 'firebase/firestore';
import { deleteDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { Progress } from '@/components/ui/progress';

interface InventoryListProps {
  items: InventoryItem[];
  isLoading: boolean;
  onEdit: (item: InventoryItem) => void;
  userId: string;
}

export function InventoryList({ items, isLoading, onEdit, userId }: InventoryListProps) {
  const firestore = useFirestore();
  const { toast } = useToast();

  const handleDelete = (id: string) => {
    if (!firestore) return;
    if (confirm('Are you sure you want to delete this item? Historical invoices will not be affected.')) {
      deleteDocumentNonBlocking(doc(firestore, `users/${userId}/inventory/${id}`));
    }
  };

  const handleAdjustStock = (item: InventoryItem, amount: number) => {
    if (!firestore) return;
    const newQty = Math.max(0, item.quantity + amount);
    if (newQty === item.quantity) return;

    const docRef = doc(firestore, `users/${userId}/inventory/${item.id}`);
    updateDocumentNonBlocking(docRef, {
      quantity: newQty,
      updatedAt: new Date().toISOString()
    });

    toast({
      title: "Stock Adjusted",
      description: `${item.name} quantity updated to ${newQty} ${item.unit}.`,
      duration: 2000,
    });
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
            <TableHead className="w-[320px]">Product & Identity</TableHead>
            <TableHead className="hidden md:table-cell">Storage & Logistics</TableHead>
            <TableHead className="text-center">Stock Health</TableHead>
            <TableHead className="text-right">Pricing & Valuation</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => {
            const isLowStock = item.minStockLevel !== undefined && item.quantity <= item.minStockLevel;
            const margin = item.sellingPrice - (item.purchasePrice || 0);
            const marginPercent = item.purchasePrice ? Math.round((margin / item.purchasePrice) * 100) : 0;
            const stockProgress = item.minStockLevel ? Math.min(100, (item.quantity / (item.minStockLevel * 2)) * 100) : 100;
            const rowValue = item.quantity * (item.purchasePrice || 0);
            
            // Placeholder image handling
            const displayImageUrl = item.imageUrl || `https://picsum.photos/seed/${item.id.substring(0, 5)}/100/100`;

            return (
              <TableRow key={item.id} className={cn(
                "group transition-colors animate-in fade-in slide-in-from-top-1 duration-300",
                isLowStock ? "bg-orange-50/30 hover:bg-orange-50/50" : "hover:bg-muted/10"
              )}>
                <TableCell className="py-4">
                  <div className="flex items-center gap-4">
                    <div className="relative h-12 w-12 shrink-0 rounded-lg border overflow-hidden bg-white shadow-sm group-hover:scale-105 transition-transform">
                      <Image 
                        src={displayImageUrl} 
                        alt={item.name} 
                        fill 
                        className="object-cover" 
                        data-ai-hint="electrical supplies"
                      />
                    </div>
                    <div className="flex flex-col gap-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-foreground truncate max-w-[180px]">{item.name}</span>
                        {isLowStock && <AlertTriangle className="h-3 w-3 text-orange-500 shrink-0" />}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-[9px] uppercase tracking-wider font-bold">
                        <span className="bg-primary/10 text-primary px-1.5 rounded flex items-center gap-1">
                          <ShieldCheck className="h-2.5 w-2.5" />
                          {item.brand || 'Generic'}
                        </span>
                        <span className="text-muted-foreground font-mono">SKU: {item.sku || '---'}</span>
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-medium">
                      <MapPin className="h-3 w-3 text-primary opacity-60" />
                      {item.location || 'Main Floor'}
                    </div>
                    {item.supplier && (
                      <div className="flex items-center gap-1.5 text-[10px] text-blue-600 font-bold uppercase tracking-tighter">
                        <Truck className="h-3 w-3" />
                        {item.supplier}
                      </div>
                    )}
                    {item.category && (
                      <Badge variant="outline" className="w-fit text-[8px] py-0 h-4 border-muted-foreground/20">
                        {item.category}
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-center py-4 min-w-[140px]">
                  <div className="flex flex-col items-center gap-2">
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7 text-muted-foreground hover:bg-red-50 hover:text-red-600"
                        onClick={() => handleAdjustStock(item, -1)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <div className="flex flex-col items-center">
                        <span className={cn(
                          "font-bold text-base min-w-[3ch] text-center leading-none",
                          isLowStock ? "text-orange-600" : "text-foreground"
                        )}>
                          {item.quantity}
                        </span>
                        <span className="text-[8px] text-muted-foreground font-bold uppercase">{item.unit}</span>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7 text-muted-foreground hover:bg-green-50 hover:text-green-600"
                        onClick={() => handleAdjustStock(item, 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="w-24 space-y-1">
                      <Progress 
                        value={stockProgress} 
                        className={cn(
                          "h-1.5", 
                          isLowStock ? "[&>div]:bg-orange-500" : "[&>div]:bg-green-500"
                        )} 
                      />
                      <div className="flex justify-between text-[8px] font-bold text-muted-foreground">
                        <span>Min: {item.minStockLevel || 0}</span>
                        <span>{Math.round(stockProgress)}%</span>
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-right py-4">
                  <div className="flex flex-col items-end">
                    <span className="font-bold text-primary">{formatCurrency(item.sellingPrice)}</span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[10px] text-muted-foreground">Asset: {formatCurrency(rowValue)}</span>
                      <Badge variant="secondary" className={cn(
                        "text-[8px] px-1 h-3.5",
                        marginPercent > 20 ? "bg-green-50 text-green-700" : "bg-orange-50 text-orange-700"
                      )}>
                        {marginPercent}% ROI
                      </Badge>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-right py-4">
                  <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => onEdit(item)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive h-8 w-8" onClick={() => handleDelete(item.id)}>
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
