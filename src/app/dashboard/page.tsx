'use client';

import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { Invoice, InventoryItem, LaborRecord } from '@/lib/types';
import { MainHeader } from '@/components/main-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  TrendingUp, 
  Banknote, 
  AlertCircle, 
  Users, 
  ShoppingCart,
  ArrowUpRight,
  Wallet
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';

export default function DashboardPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && (!user || user.isAnonymous)) {
      router.push("/login");
    }
  }, [user, isUserLoading, router]);

  // Data fetching
  const invoicesRef = useMemoFirebase(
    () => (firestore && user ? collection(firestore, `users/${user.uid}/invoices`) : null),
    [firestore, user]
  );
  const inventoryRef = useMemoFirebase(
    () => (firestore && user ? collection(firestore, `users/${user.uid}/inventory`) : null),
    [firestore, user]
  );
  const recordsRef = useMemoFirebase(
    () => (firestore && user ? collection(firestore, `users/${user.uid}/laborRecords`) : null),
    [firestore, user]
  );

  const { data: invoices, isLoading: invLoading } = useCollection<Invoice>(invoicesRef);
  const { data: items, isLoading: stockLoading } = useCollection<InventoryItem>(inventoryRef);
  const { data: laborRecords, isLoading: laborLoading } = useCollection<LaborRecord>(recordsRef);

  // Stats calculation
  const stats = useMemo(() => {
    if (!invoices || !items || !laborRecords) return null;

    const totalSales = invoices.reduce((sum, inv) => sum + (inv.grandTotalAmount || 0), 0);
    const totalWages = laborRecords.reduce((sum, rec) => sum + (rec.amount || 0), 0);
    const netProfit = totalSales - totalWages;

    const pendingPayments = invoices
      .filter(inv => inv.status !== 'Paid' && inv.status !== 'Cancelled')
      .reduce((sum, inv) => sum + (inv.grandTotalAmount || 0), 0);
    
    const lowStockCount = items.filter(item => 
      item.minStockLevel !== undefined && item.quantity <= item.minStockLevel
    ).length;

    // Monthly revenue chart data (last 6 months)
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentYear = new Date().getFullYear();
    
    const chartData = months.map((month, idx) => {
      const monthlyTotal = invoices
        .filter(inv => {
          const date = new Date(inv.invoiceDate);
          return date.getMonth() === idx && date.getFullYear() === currentYear;
        })
        .reduce((sum, inv) => sum + (inv.grandTotalAmount || 0), 0);
      
      return { name: month, total: monthlyTotal };
    });

    return { totalSales, totalWages, netProfit, pendingPayments, lowStockCount, chartData };
  }, [invoices, items, laborRecords]);

  if (isUserLoading || !user) return null;

  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })
      .format(amount).replace('₹', 'Rs ');

  return (
    <div className="min-h-screen bg-background text-foreground">
      <MainHeader />
      <main className="container mx-auto p-4 md:p-6 lg:p-8">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold font-headline">Business Overview</h2>
              <p className="text-muted-foreground mt-1">Real-time performance of Dubai Tools.</p>
            </div>
            <div className="hidden md:block">
              <Card className="bg-primary text-primary-foreground border-none shadow-lg">
                <CardContent className="pt-4 pb-4 px-6">
                  <p className="text-xs uppercase tracking-wider font-bold opacity-80">Net Earnings</p>
                  <div className="text-2xl font-bold">{invLoading || laborLoading ? "..." : formatCurrency(stats?.netProfit || 0)}</div>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-l-4 border-l-primary">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between space-y-0 pb-2">
                  <p className="text-sm font-medium">Total Sales</p>
                  <TrendingUp className="h-4 w-4 text-primary" />
                </div>
                {invLoading ? <Skeleton className="h-8 w-24" /> : (
                  <div className="text-2xl font-bold">{formatCurrency(stats?.totalSales || 0)}</div>
                )}
                <p className="text-xs text-muted-foreground mt-1 flex items-center">
                  <ArrowUpRight className="h-3 w-3 mr-1 text-green-500" /> Gross revenue
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-accent">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between space-y-0 pb-2">
                  <p className="text-sm font-medium">Pending Payments</p>
                  <Banknote className="h-4 w-4 text-accent" />
                </div>
                {invLoading ? <Skeleton className="h-8 w-24" /> : (
                  <div className="text-2xl font-bold">{formatCurrency(stats?.pendingPayments || 0)}</div>
                )}
                <p className="text-xs text-muted-foreground mt-1">Outstanding from customers</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-orange-500">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between space-y-0 pb-2">
                  <p className="text-sm font-medium">Low Stock Alerts</p>
                  <AlertCircle className="h-4 w-4 text-orange-500" />
                </div>
                {stockLoading ? <Skeleton className="h-8 w-12" /> : (
                  <div className="text-2xl font-bold">{stats?.lowStockCount || 0}</div>
                )}
                <p className="text-xs text-muted-foreground mt-1">Items need restocking</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-blue-500">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between space-y-0 pb-2">
                  <p className="text-sm font-medium">Total Labor Wages</p>
                  <Wallet className="h-4 w-4 text-blue-500" />
                </div>
                {laborLoading ? <Skeleton className="h-8 w-24" /> : (
                  <div className="text-2xl font-bold">{formatCurrency(stats?.totalWages || 0)}</div>
                )}
                <p className="text-xs text-muted-foreground mt-1">Cumulative worker payments</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
            <Card className="lg:col-span-4">
              <CardHeader>
                <CardTitle>Revenue Chart</CardTitle>
                <CardDescription>Monthly revenue trends for {new Date().getFullYear()}</CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                <div className="h-[300px] w-full">
                  {invLoading ? <Skeleton className="h-full w-full" /> : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stats?.chartData || []}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                        <XAxis 
                          dataKey="name" 
                          stroke="#888888" 
                          fontSize={12} 
                          tickLine={false} 
                          axisLine={false} 
                        />
                        <YAxis 
                          stroke="#888888" 
                          fontSize={12} 
                          tickLine={false} 
                          axisLine={false} 
                          tickFormatter={(value) => `Rs ${value}`}
                        />
                        <Tooltip 
                          cursor={{fill: 'hsl(var(--primary) / 0.1)'}}
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))', 
                            borderColor: 'hsl(var(--border))',
                            borderRadius: 'var(--radius)'
                          }}
                        />
                        <Bar 
                          dataKey="total" 
                          fill="hsl(var(--primary))" 
                          radius={[4, 4, 0, 0]} 
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest generated invoices.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-8">
                  {invLoading ? <Skeleton className="h-48 w-full" /> : 
                    invoices?.slice(0, 5).map(inv => (
                      <div key={inv.id} className="flex items-center">
                        <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                          <ShoppingCart className="h-5 w-5 text-primary" />
                        </div>
                        <div className="ml-4 space-y-1">
                          <p className="text-sm font-medium leading-none">{inv.customerName}</p>
                          <p className="text-sm text-muted-foreground">{inv.invoiceNumber}</p>
                        </div>
                        <div className="ml-auto font-medium">
                          +{formatCurrency(inv.grandTotalAmount)}
                        </div>
                      </div>
                    ))
                  }
                  {!invLoading && invoices?.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">No recent invoices.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <footer className="container mx-auto py-6 px-4 text-center text-sm text-muted-foreground md:px-6">
        <p>&copy; {new Date().getFullYear()} Dubai Tools. All rights reserved.</p>
      </footer>
    </div>
  );
}
