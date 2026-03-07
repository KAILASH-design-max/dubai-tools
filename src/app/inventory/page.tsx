'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { InventoryItem } from '@/lib/types';
import { MainHeader } from '@/components/main-header';
import { Button } from '@/components/ui/button';
import { Plus, Package, Search } from 'lucide-react';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { InventoryList } from '@/components/inventory/inventory-list';
import { InventoryDialog } from '@/components/inventory/inventory-dialog';

export default function InventoryPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
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

  const filteredItems = items?.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.sku?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleAddItem = () => {
    setEditingItem(null);
    setIsDialogOpen(true);
  };

  const handleEditItem = (item: InventoryItem) => {
    setEditingItem(item);
    setIsDialogOpen(true);
  };

  if (isUserLoading || !user) return null;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <MainHeader />
      <main className="container mx-auto p-4 md:p-6 lg:p-8">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold font-headline flex items-center gap-3">
                <Package className="h-8 w-8 text-primary" />
                Inventory Management
              </h2>
              <p className="text-muted-foreground mt-1">Track and manage your electrical supplies and tools.</p>
            </div>
            <Button onClick={handleAddItem}>
              <Plus className="mr-2 h-4 w-4" />
              Add New Item
            </Button>
          </div>

          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="space-y-1">
                  <CardTitle>Stock Levels</CardTitle>
                  <CardDescription>Items highlighted in orange are below minimum stock levels.</CardDescription>
                </div>
                <div className="relative w-full md:w-72">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search by name or SKU..." 
                    className="pl-9" 
                    value={searchTerm} 
                    onChange={(e) => setSearchTerm(e.target.value)} 
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
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
        <p>&copy; {new Date().getFullYear()} Dubai Tools. All rights reserved.</p>
      </footer>
    </div>
  );
}
