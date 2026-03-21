
'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { InventoryItem } from '@/lib/types';
import { MainHeader } from '@/components/main-header';
import { Button } from '@/components/ui/button';
import { 
  Plus, 
  Search, 
  Package, 
  AlertTriangle, 
  TrendingUp, 
  Filter,
  BarChart3,
  Boxes,
  Layers
} from 'lucide-react';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { InventoryList } from '@/components/inventory/inventory-list';
import { InventoryDialog } from '@/components/inventory/inventory-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from '@/components/ui/badge';

export default function InventoryPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

  useEffect(() => {
    if (!isUserLoading && (!user || user.isAnonymous)) {
      router.push("/login");
    }
  }, [user, isUserLoading, router]);

  const inventoryRef = useMemoFirebase(
    () => (firestore && user ? collection(firestore, `users/${user.uid}/inventory`) : null),
    [firestore, user]
  );

  const inventoryQuery = useMemoFirebase(
    () => (inventoryRef ? query(inventoryRef, orderBy('name', 'asc')) : null),
    [inventoryRef]
  );

  const { data: items, isLoading } = useCollection<InventoryItem>(inventoryQuery);

  // Statistics calculation
  const stats = useMemo(() => {
    if (!items) return { totalValue: 0, lowStockCount: 0, totalSkus: 0 };
    return items.reduce((acc, item) => {
      const isLow = item.minStockLevel !== undefined && item.quantity <= item.minStockLevel;
      acc.totalValue += (item.quantity * (item.purchasePrice || 0));
      if (isLow) acc.lowStockCount += 1;
      acc.totalSkus += 1;
      return acc;
    }, { totalValue: 0, lowStockCount: 0, totalSkus: 0 });
  }, [items]);

  // Unique categories for the filter
  const categories = useMemo(() => {
    if (!items) return [];
    const cats = items
      .map(item => item.category)
      .filter((cat): cat is string => !!cat);
    return Array.from(new Set(cats)).sort();
  }, [items]);

  const filteredItems = useMemo(() => {
    if (!items) return [];
    return items.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           item.sku?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const isLow = item.minStockLevel !== undefined && item.quantity <= item.minStockLevel;
      const matchesStatus = statusFilter === 'all' || 
                           (statusFilter === 'low' && isLow) || 
                           (statusFilter === 'in-stock' && !isLow);
      
      const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;

      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [items, searchTerm, statusFilter, categoryFilter]);

  const handleAddItem = () => {
    setEditingItem(null);
    setIsDialogOpen(true);
  };

  const handleEditItem = (item: InventoryItem) => {
    setEditingItem(item);
    setIsDialogOpen(true);
  };

  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })
      .format(amount).replace('₹', 'Rs ');

  if (isUserLoading || !user) return null;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <MainHeader />
      <main className="container mx-auto p-4 md:p-6 lg:p-8">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold font-headline flex items-center gap-3">
                <Boxes className="h-8 w-8 text-primary" />
                Inventory Master
              </h2>
              <p className="text-muted-foreground mt-1">Strategic oversight of your electrical assets and pricing.</p>
            </div>
            <Button onClick={handleAddItem} size="lg" className="shadow-lg hover:shadow-xl transition-all">
              <Plus className="mr-2 h-5 w-5" />
              New Stock Item
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between space-y-0 pb-2">
                  <p className="text-sm font-bold uppercase tracking-widest opacity-60">Asset Valuation</p>
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
                <div className="text-2xl font-bold text-primary">
                  {isLoading ? "..." : formatCurrency(stats.totalValue)}
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">Based on purchase rates</p>
              </CardContent>
            </Card>

            <Card className={stats.lowStockCount > 0 ? "bg-orange-50 border-orange-200" : ""}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between space-y-0 pb-2">
                  <p className="text-sm font-bold uppercase tracking-widest opacity-60">Stock Alerts</p>
                  <AlertTriangle className={stats.lowStockCount > 0 ? "h-5 w-5 text-orange-600 animate-pulse" : "h-5 w-5 text-muted-foreground"} />
                </div>
                <div className={stats.lowStockCount > 0 ? "text-2xl font-bold text-orange-600" : "text-2xl font-bold"}>
                  {isLoading ? "..." : stats.lowStockCount}
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">Items below safety threshold</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between space-y-0 pb-2">
                  <p className="text-sm font-bold uppercase tracking-widest opacity-60">Catalog Size</p>
                  <Package className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="text-2xl font-bold">
                  {isLoading ? "..." : stats.totalSkus}
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">Unique products managed</p>
              </CardContent>
            </Card>
          </div>

          <Card className="border-none shadow-sm ring-1 ring-border overflow-hidden">
            <CardHeader className="bg-muted/30 border-b pb-6">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="space-y-1">
                  <CardTitle className="text-xl">Stock Ledger</CardTitle>
                  <CardDescription>Live database of supplies, fixtures, and components.</CardDescription>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="Search name or SKU..." 
                      className="pl-9 bg-background h-9" 
                      value={searchTerm} 
                      onChange={(e) => setSearchTerm(e.target.value)} 
                    />
                  </div>
                  
                  <div className="flex items-center gap-2 bg-background px-2 py-1 rounded-md border text-xs">
                    <Filter className="h-3 w-3 text-muted-foreground" />
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-[110px] h-7 border-none shadow-none focus:ring-0">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="in-stock">In Stock</SelectItem>
                        <SelectItem value="low">Low Stock</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center gap-2 bg-background px-2 py-1 rounded-md border text-xs">
                    <Layers className="h-3 w-3 text-muted-foreground" />
                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                      <SelectTrigger className="w-[130px] h-7 border-none shadow-none focus:ring-0">
                        <SelectValue placeholder="Category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {categories.map(cat => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0 sm:p-6">
              <InventoryList 
                items={filteredItems} 
                isLoading={isLoading} 
                onEdit={handleEditItem} 
                userId={user.uid}
              />
            </CardContent>
          </Card>
        </div>
      </main>

      <InventoryDialog 
        isOpen={isDialogOpen} 
        onOpenChange={setIsDialogOpen} 
        item={editingItem} 
        userId={user.uid}
      />
      
      <footer className="container mx-auto py-6 px-4 text-center text-sm text-muted-foreground md:px-6">
        <p>&copy; {new Date().getFullYear()} Dubai Tools. Asset Management System.</p>
      </footer>
    </div>
  );
}
