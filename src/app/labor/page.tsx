'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, doc, updateDoc } from 'firebase/firestore';
import { Laborer, LaborRecord } from '@/lib/types';
import { MainHeader } from '@/components/main-header';
import { Button } from '@/components/ui/button';
import { Plus, Users, Search, Calendar, Trash2, Edit, CheckCircle, Wallet, Banknote, Clock } from 'lucide-react';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LaborerDialog } from '@/components/labor/laborer-dialog';
import { LaborRecordDialog } from '@/components/labor/labor-record-dialog';
import { format } from 'date-fns';
import { deleteDocumentNonBlocking } from '@/firebase';
import { useToast } from '@/hooks/use-toast';

export default function LaborManagementPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [isLaborerDialogOpen, setIsLaborerDialogOpen] = useState(false);
  const [isRecordDialogOpen, setIsRecordDialogOpen] = useState(false);
  const [editingLaborer, setEditingLaborer] = useState<Laborer | null>(null);
  const [editingRecord, setEditingRecord] = useState<LaborRecord | null>(null);

  useEffect(() => {
    if (!isUserLoading && (!user || user.isAnonymous)) {
      router.push("/login");
    }
  }, [user, isUserLoading, router]);

  const laborersRef = useMemoFirebase(
    () => (firestore && user ? collection(firestore, `users/${user.uid}/laborers`) : null),
    [firestore, user]
  );
  const recordsRef = useMemoFirebase(
    () => (firestore && user ? collection(firestore, `users/${user.uid}/laborRecords`) : null),
    [firestore, user]
  );

  const laborersQuery = useMemoFirebase(
    () => (laborersRef ? query(laborersRef, orderBy('name', 'asc')) : null),
    [laborersRef]
  );
  const recordsQuery = useMemoFirebase(
    () => (recordsRef ? query(recordsRef, orderBy('date', 'desc')) : null),
    [recordsRef]
  );

  const { data: laborers, isLoading: isLoadingLaborers } = useCollection<Laborer>(laborersQuery);
  const { data: records, isLoading: isLoadingRecords } = useCollection<LaborRecord>(recordsQuery);

  const stats = useMemo(() => {
    if (!records) return { paid: 0, pending: 0 };
    return records.reduce((acc, rec) => {
      if (rec.status === 'Paid') acc.paid += rec.amount;
      else acc.pending += rec.amount;
      return acc;
    }, { paid: 0, pending: 0 });
  }, [records]);

  const laborerBalances = useMemo(() => {
    if (!records || !laborers) return {};
    const balances: Record<string, number> = {};
    records.forEach(rec => {
      if (rec.status === 'Pending') {
        balances[rec.laborerId] = (balances[rec.laborerId] || 0) + rec.amount;
      }
    });
    return balances;
  }, [records, laborers]);

  const filteredLaborers = laborers?.filter(l => 
    l.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const filteredRecords = records?.filter(r => 
    r.laborerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.workDescription?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleAddLaborer = () => {
    setEditingLaborer(null);
    setIsLaborerDialogOpen(true);
  };

  const handleEditLaborer = (laborer: Laborer) => {
    setEditingLaborer(laborer);
    setIsLaborerDialogOpen(true);
  };

  const handleAddRecord = () => {
    setEditingRecord(null);
    setIsRecordDialogOpen(true);
  };

  const handleEditRecord = (record: LaborRecord) => {
    setEditingRecord(record);
    setIsRecordDialogOpen(true);
  };

  const handleMarkAsPaid = async (recordId: string) => {
    if (!firestore || !user) return;
    try {
      const docRef = doc(firestore, `users/${user.uid}/laborRecords/${recordId}`);
      await updateDoc(docRef, { status: 'Paid', updatedAt: new Date().toISOString() });
      toast({ title: "Wage Paid", description: "Record updated to Paid status." });
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: "Failed to update record." });
    }
  };

  const handleDeleteLaborer = (id: string) => {
    if (confirm('Delete this laborer? This will not delete their historical records.')) {
      deleteDocumentNonBlocking(doc(firestore!, `users/${user!.uid}/laborers/${id}`));
    }
  };

  const handleDeleteRecord = (id: string) => {
    if (confirm('Delete this work record?')) {
      deleteDocumentNonBlocking(doc(firestore!, `users/${user!.uid}/laborRecords/${id}`));
    }
  };

  const formatCurrency = (val: number) => `Rs ${val.toLocaleString()}`;

  if (isUserLoading || !user) return null;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <MainHeader />
      <main className="container mx-auto p-4 md:p-6 lg:p-8">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold font-headline">
                Labor Management
              </h2>
              <p className="text-muted-foreground mt-1">Manage your workers and their daily wage records.</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleAddLaborer}>
                <Plus className="mr-2 h-4 w-4" />
                Add Laborer
              </Button>
              <Button onClick={handleAddRecord}>
                <Calendar className="mr-2 h-4 w-4" />
                New Record
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-l-4 border-l-primary">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Paid</p>
                    <p className="text-2xl font-bold text-primary">{formatCurrency(stats.paid)}</p>
                  </div>
                  <Wallet className="h-8 w-8 text-primary/20" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-orange-500">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Outstanding</p>
                    <p className="text-2xl font-bold text-orange-500">{formatCurrency(stats.pending)}</p>
                  </div>
                  <Clock className="h-8 w-8 text-orange-500/20" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-blue-500">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Workers</p>
                    <p className="text-2xl font-bold text-blue-500">{laborers?.length || 0}</p>
                  </div>
                  <Users className="h-8 w-8 text-blue-500/20" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="records" className="space-y-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <TabsList>
                <TabsTrigger value="records">Work Records</TabsTrigger>
                <TabsTrigger value="laborers">Laborer List</TabsTrigger>
              </TabsList>
              <div className="relative w-full md:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search workers or tasks..." 
                  className="pl-9" 
                  value={searchTerm} 
                  onChange={(e) => setSearchTerm(e.target.value)} 
                />
              </div>
            </div>

            <TabsContent value="records">
              <Card>
                <CardHeader>
                  <CardTitle>Daily Work History</CardTitle>
                  <CardDescription>Track daily tasks and payment status.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Laborer</TableHead>
                        <TableHead>Work Description</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead className="text-center">Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRecords.map((record) => (
                        <TableRow key={record.id}>
                          <TableCell className="font-medium">
                            {format(new Date(`${record.date}T00:00:00`), 'dd MMM yyyy')}
                          </TableCell>
                          <TableCell>{record.laborerName}</TableCell>
                          <TableCell className="max-w-[200px] truncate">{record.workDescription || '-'}</TableCell>
                          <TableCell className="text-right font-bold">{formatCurrency(record.amount)}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant={record.status === 'Paid' ? 'default' : 'outline'} className={record.status === 'Paid' ? 'bg-green-600' : ''}>
                              {record.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              {record.status === 'Pending' && (
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="text-green-600" 
                                  onClick={() => handleMarkAsPaid(record.id)}
                                  title="Mark as Paid"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                              )}
                              <Button variant="ghost" size="icon" onClick={() => handleEditRecord(record)} title="Edit">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDeleteRecord(record.id)} title="Delete">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      {filteredRecords.length === 0 && !isLoadingRecords && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                            No work records found.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="laborers">
              <Card>
                <CardHeader>
                  <CardTitle>Laborer Profiles</CardTitle>
                  <CardDescription>Manage your workers and their standard daily rates.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead className="text-right">Daily Rate</TableHead>
                        <TableHead className="text-right">Total Owed</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLaborers.map((laborer) => (
                        <TableRow key={laborer.id}>
                          <TableCell className="font-medium">{laborer.name}</TableCell>
                          <TableCell>{laborer.phone || '-'}</TableCell>
                          <TableCell className="text-right">{formatCurrency(laborer.dailyRate)}</TableCell>
                          <TableCell className="text-right">
                            <span className={laborerBalances[laborer.id] > 0 ? "font-bold text-orange-600" : "text-muted-foreground"}>
                              {formatCurrency(laborerBalances[laborer.id] || 0)}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="icon" onClick={() => handleEditLaborer(laborer)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDeleteLaborer(laborer.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      {filteredLaborers.length === 0 && !isLoadingLaborers && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                            No laborers found.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <LaborerDialog 
        isOpen={isLaborerDialogOpen} 
        onOpenChange={setIsLaborerDialogOpen} 
        laborer={editingLaborer} 
        userId={user.uid}
      />

      <LaborRecordDialog 
        isOpen={isRecordDialogOpen} 
        onOpenChange={setIsRecordDialogOpen} 
        record={editingRecord} 
        laborers={laborers || []}
        userId={user.uid}
      />
      
      <footer className="container mx-auto py-6 px-4 text-center text-sm text-muted-foreground md:px-6">
        <p>&copy; {new Date().getFullYear()} Dubai Tools. All rights reserved.</p>
      </footer>
    </div>
  );
}
