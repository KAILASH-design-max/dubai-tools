'use client';

import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { Invoice, InventoryItem, LaborRecord, Laborer } from '@/lib/types';
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
  Wallet,
  Package,
  LineChart,
  UserCheck
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie
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
  const laborersRef = useMemoFirebase(
    () => (firestore && user ? collection(firestore, `users/${user.uid}/laborers`) : null),
    [firestore, user]
  );

  const { data: invoices, isLoading: invLoading } = useCollection<Invoice>(invoicesRef);
  const { data: items, isLoading: stockLoading } = useCollection<InventoryItem>(inventoryRef);
  const { data: laborRecords, isLoading: laborLoading } = useCollection<LaborRecord>(recordsRef);
  const { data: laborers } = useCollection<Laborer>(laborersRef);

  // Stats calculation
  const stats = useMemo(() => {
    if (!invoices || !items || !laborRecords) return null;

    const totalSales = invoices.reduce((sum, inv) => sum + (inv.grandTotalAmount || 0), 0);
    const totalWages = laborRecords.reduce((sum, rec) => sum + (rec.amount || 0), 0);
    const netProfit = totalSales - totalWages;

    const inventoryValue = items.reduce((sum, item) => sum + ((item.quantity || 0) * (item.purchasePrice || 0)), 0);
    
    const pendingPayments = invoices
      .filter(inv => inv.status !== 'Paid' && inv.status !== 'Cancelled')
      .reduce((sum, inv) => sum + (inv.grandTotalAmount || 0), 0);
    
    const lowStockCount = items.filter(item => 
      item.minStockLevel !== undefined && item.quantity <= item.minStockLevel
    ).length;

    // Monthly revenue chart data
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

    // Top Customers calculation
    const customerTotals: Record<string, number> = {};
    invoices.forEach(inv => {
      if (inv.customerName) {
        customerTotals[inv.customerName] = (customerTotals[inv.customerName] || 0) + (inv.grandTotalAmount || 0);
      }
    });
    const topCustomers = Object.entries(customerTotals)
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    // Labor breakdown
    const workerTotals: Record<string, number> = {};
    laborRecords.forEach(rec => {
      workerTotals[rec.laborerName] = (workerTotals[rec.laborerName] || 0) + (rec.amount || 0);
    });
    const laborBreakdown = Object.entries(workerTotals)
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    return { 
      totalSales, 
      totalWages, 
      netProfit, 
      pendingPayments, 
      lowStockCount, 
      inventoryValue,
      chartData, 
      topCustomers,
      laborBreakdown
    };
  }, [invoices, items, laborRecords]);

  if (isUserLoading || !user) return null;

  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })
      .format(amount).replace('₹', 'Rs ');

  const CHART_COLORS = ['hsl(var(--primary))', 'hsl(var(--accent))', '#f97316', '#3b82f6', '#8b5cf6'];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <MainHeader />
      <main className="container mx-auto p-4 md:p-6 lg:p-8">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold font-headline tracking-tight text-primary">Command Center</h2>
              <p className="text-muted-foreground mt-1">Strategic overview of Dubai Tools operations.</p>
            </div>
            <div className="flex items-center gap-3">
               <Card className="bg-primary/5 border-primary/20 shadow-none px-4 py-2">
                 <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-primary" />
                    <span className="text-xs font-bold uppercase tracking-wider opacity-70">Stock Asset Value</span>
                 </div>
                 <div className="text-xl font-bold text-primary">
                    {stockLoading ? "..." : formatCurrency(stats?.inventoryValue || 0)}
                 </div>
               </Card>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="relative overflow-hidden group border-none shadow-md bg-gradient-to-br from-primary/10 to-transparent">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between space-y-0 pb-2">
                  <p className="text-sm font-bold uppercase tracking-widest opacity-60">Gross Revenue</p>
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
                {invLoading ? <Skeleton className="h-8 w-24" /> : (
                  <div className="text-3xl font-bold">{formatCurrency(stats?.totalSales || 0)}</div>
                )}
                <div className="mt-2 flex items-center gap-1 text-xs text-green-600 font-bold">
                  <ArrowUpRight className="h-3 w-3" />
                  <span>Total billed to date</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-md bg-white dark:bg-card">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between space-y-0 pb-2">
                  <p className="text-sm font-bold uppercase tracking-widest opacity-60 text-accent">Pending Income</p>
                  <Banknote className="h-5 w-5 text-accent" />
                </div>
                {invLoading ? <Skeleton className="h-8 w-24" /> : (
                  <div className="text-3xl font-bold text-accent">{formatCurrency(stats?.pendingPayments || 0)}</div>
                )}
                <p className="text-xs text-muted-foreground mt-2">Unpaid customer invoices</p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-md bg-white dark:bg-card">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between space-y-0 pb-2">
                  <p className="text-sm font-bold uppercase tracking-widest opacity-60 text-orange-600">Inventory Alert</p>
                  <AlertCircle className="h-5 w-5 text-orange-500" />
                </div>
                {stockLoading ? <Skeleton className="h-8 w-12" /> : (
                  <div className="text-3xl font-bold text-orange-600">{stats?.lowStockCount || 0}</div>
                )}
                <p className="text-xs text-muted-foreground mt-2">Items below safety levels</p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-md bg-white dark:bg-card">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between space-y-0 pb-2">
                  <p className="text-sm font-bold uppercase tracking-widest opacity-60 text-blue-600">Net Profit</p>
                  <LineChart className="h-5 w-5 text-blue-600" />
                </div>
                {invLoading || laborLoading ? <Skeleton className="h-8 w-24" /> : (
                  <div className="text-3xl font-bold text-blue-600">{formatCurrency(stats?.netProfit || 0)}</div>
                )}
                <p className="text-xs text-muted-foreground mt-2">Sales minus labor costs</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <Card className="lg:col-span-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Monthly Performance
                </CardTitle>
                <CardDescription>Revenue trends for the current calendar year.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[350px] w-full">
                  {invLoading ? <Skeleton className="h-full w-full" /> : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stats?.chartData || []}>
                        <defs>
                          <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.2}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
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
                          cursor={{fill: 'hsl(var(--primary) / 0.05)'}}
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))', 
                            borderColor: 'hsl(var(--border))',
                            borderRadius: 'var(--radius)',
                            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'
                          }}
                        />
                        <Bar 
                          dataKey="total" 
                          fill="url(#barGradient)"
                          radius={[6, 6, 0, 0]} 
                          barSize={30}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCheck className="h-5 w-5 text-accent" />
                  Top Customers
                </CardTitle>
                <CardDescription>Highest revenue generators.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {invLoading ? (
                    Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)
                  ) : (
                    stats?.topCustomers.map((customer, index) => (
                      <div key={customer.name} className="flex items-center">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/10 text-accent text-xs font-bold">
                          {index + 1}
                        </div>
                        <div className="ml-4 space-y-1 flex-1 min-w-0">
                          <p className="text-sm font-bold truncate">{customer.name}</p>
                          <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-accent" 
                              style={{ width: `${(customer.total / (stats.topCustomers[0]?.total || 1)) * 100}%` }}
                            />
                          </div>
                        </div>
                        <div className="ml-4 text-xs font-bold">
                          {formatCurrency(customer.total)}
                        </div>
                      </div>
                    ))
                  )}
                  {stats?.topCustomers.length === 0 && !invLoading && (
                    <p className="text-center text-muted-foreground py-12">No sales data yet.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-blue-500" />
                  Labor Cost Distribution
                </CardTitle>
                <CardDescription>Breakdown of wages paid per worker.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[250px] w-full">
                  {laborLoading ? <Skeleton className="h-full w-full" /> : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stats?.laborBreakdown || []} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="hsl(var(--border))" />
                        <XAxis type="number" hide />
                        <YAxis 
                          dataKey="name" 
                          type="category" 
                          axisLine={false} 
                          tickLine={false}
                          fontSize={12}
                          width={100}
                        />
                        <Tooltip />
                        <Bar dataKey="total" radius={[0, 4, 4, 0]} barSize={20}>
                          {stats?.laborBreakdown.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5 text-primary" />
                  Recent Invoices
                </CardTitle>
                <CardDescription>Quick access to your latest transactions.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {invLoading ? (
                    Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)
                  ) : (
                    invoices?.slice(0, 5).map(inv => (
                      <div key={inv.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/30 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <ShoppingCart className="h-4 w-4 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold truncate">{inv.customerName}</p>
                            <p className="text-[10px] uppercase tracking-tighter text-muted-foreground">{inv.invoiceNumber} • {inv.status}</p>
                          </div>
                        </div>
                        <div className="text-sm font-bold text-primary">
                          {formatCurrency(inv.grandTotalAmount)}
                        </div>
                      </div>
                    ))
                  )}
                  {!invLoading && invoices?.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">No recent activity.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <footer className="container mx-auto py-8 px-4 text-center text-sm text-muted-foreground md:px-6">
        <p>&copy; {new Date().getFullYear()} Dubai Tools. Business performance monitor.</p>
      </footer>
    </div>
  );
}
