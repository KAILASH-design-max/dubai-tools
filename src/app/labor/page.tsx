
'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useCollection, useMemoFirebase, useCompanyProfile } from '@/firebase';
import { collection, query, orderBy, doc, updateDoc, writeBatch, getDocs, where, addDoc } from 'firebase/firestore';
import { Laborer, LaborRecord } from '@/lib/types';
import { MainHeader } from '@/components/main-header';
import { Button } from '@/components/ui/button';
import { 
  Plus, 
  Users, 
  Search, 
  Calendar, 
  Trash2, 
  Edit, 
  CheckCircle, 
  Wallet, 
  Clock, 
  Filter, 
  CreditCard, 
  ArrowRightCircle,
  UserCheck,
  CheckSquare,
  History,
  FileText,
  Printer,
  ChevronRight,
  MapPin,
  CircleDashed
} from 'lucide-react';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LaborerDialog } from '@/components/labor/laborer-dialog';
import { LaborRecordDialog } from '@/components/labor/labor-record-dialog';
import { QuickAttendanceDialog } from '@/components/labor/quick-attendance-dialog';
import { format, startOfWeek, startOfMonth, isWithinInterval, endOfDay } from 'date-fns';
import { deleteDocumentNonBlocking } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Separator } from '@/components/ui/separator';
import Image from 'next/image';

function LaborerStatementModal({ 
  isOpen, 
  onOpenChange, 
  laborer, 
  records, 
  userId 
}: { 
  isOpen: boolean, 
  onOpenChange: (open: boolean) => void, 
  laborer: Laborer | null, 
  records: LaborRecord[],
  userId: string
}) {
  const { data: companyProfile } = useCompanyProfile(userId);
  
  const formatCurrency = (val: number) => `Rs ${val.toLocaleString()}`;

  const activeRecords = useMemo(() => {
    if (!laborer) return [];
    return records.filter(r => r.laborerId === laborer.id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [laborer, records]);

  const summary = useMemo(() => {
    return activeRecords.reduce((acc, r) => {
      if (r.category === 'Advance') {
        acc.advances += r.amount;
      } else {
        acc.earned += r.amount;
      }
      if (r.status === 'Paid') {
        acc.paid += r.amount;
      } else {
        acc.pending += r.amount;
      }
      return acc;
    }, { earned: 0, advances: 0, paid: 0, pending: 0 });
  }, [activeRecords]);

  const handlePrint = () => {
    window.print();
  };

  const activeProfile = companyProfile || { 
    name: 'DUBAI TOOLS', 
    addressLine1: 'Shivdhara', 
    phoneNumbers: ['9268863031', '7280944150']
  };

  if (!laborer) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <style>{`
          @media print {
            body * { visibility: hidden; }
            [role="dialog"], [role="dialog"] * { visibility: visible !important; }
            [role="dialog"] { position: absolute; left: 0; top: 0; width: 100%; border: none !important; box-shadow: none !important; }
            .print-hidden { display: none !important; }
            [aria-label="Close"] { display: none !important; }
          }
        `}</style>
        
        <DialogHeader className="print-hidden border-b pb-4">
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Laborer Statement
          </DialogTitle>
        </DialogHeader>

        <div className="py-6 space-y-6">
          {/* Header */}
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <Image src="/dubaitools.png" alt="Logo" width={48} height={48} className="object-contain" />
              <div>
                <h2 className="font-headline font-bold text-xl uppercase text-primary">{activeProfile.name}</h2>
                <p className="text-xs text-muted-foreground">{activeProfile.addressLine1}</p>
              </div>
            </div>
            <div className="text-right">
              <h3 className="text-lg font-bold">Statement of Account</h3>
              <p className="text-sm text-muted-foreground">Date: {format(new Date(), 'PP')}</p>
            </div>
          </div>

          <Separator />

          {/* Laborer Info */}
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Worker Information</p>
              <p className="text-lg font-bold">{laborer.name}</p>
              <p className="text-sm text-muted-foreground">{laborer.phone || 'No phone provided'}</p>
              <p className="text-xs text-muted-foreground italic">Joined: {format(new Date(`${laborer.joiningDate}T00:00:00`), 'PP')}</p>
            </div>
            <div className="bg-muted/30 p-4 rounded-lg flex flex-col justify-center text-right border">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Standard Daily Rate</p>
              <p className="text-2xl font-bold text-primary">{formatCurrency(laborer.dailyRate)}</p>
            </div>
          </div>

          {/* Records Table */}
          <div className="border rounded-md overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-[100px]">Date</TableHead>
                  <TableHead>Site / Description</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeRecords.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="text-xs">{format(new Date(`${r.date}T00:00:00`), 'dd MMM yyyy')}</TableCell>
                    <TableCell className="text-xs">
                      <div className="font-bold">{r.siteName || 'General Site'}</div>
                      <div className="italic text-muted-foreground text-[10px]">{r.workDescription || '-'}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[9px] h-5">
                        {r.category || 'Full Day'}
                      </Badge>
                    </TableCell>
                    <TableCell className={`text-right font-bold ${r.category === 'Advance' ? 'text-orange-600' : 'text-foreground'}`}>
                      {r.category === 'Advance' ? `-${formatCurrency(r.amount)}` : formatCurrency(r.amount)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={r.status === 'Paid' ? 'default' : 'outline'} className="text-[9px] h-5">
                        {r.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Summary Footer */}
          <div className="flex justify-end pt-4">
            <div className="w-full sm:w-1/2 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Gross Earnings:</span>
                <span>{formatCurrency(summary.earned)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Advances Taken:</span>
                <span className="text-orange-600">-{formatCurrency(summary.advances)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Net Paid to Date:</span>
                <span>{formatCurrency(summary.paid)}</span>
              </div>
              <Separator />
              <div className="flex justify-between items-center bg-primary/5 p-3 rounded-lg border border-primary/20">
                <span className="font-bold">Total Outstanding:</span>
                <span className="text-xl font-bold text-primary">{formatCurrency(summary.pending)}</span>
              </div>
            </div>
          </div>

          {/* Signature */}
          <div className="flex justify-between items-end pt-12">
            <div className="text-center w-40">
              <div className="border-t border-dashed pt-2 text-[10px] text-muted-foreground">Laborer Signature</div>
            </div>
            <div className="text-center w-40">
              <div className="border-t border-dashed pt-2 text-[10px] text-muted-foreground">Authorized Seal</div>
            </div>
          </div>
        </div>

        <DialogFooter className="print-hidden border-t pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
          <Button onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Print Statement
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function LaborManagementPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLaborerId, setFilterLaborerId] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isLaborerDialogOpen, setIsLaborerDialogOpen] = useState(false);
  const [isRecordDialogOpen, setIsRecordDialogOpen] = useState(false);
  const [isAttendanceDialogOpen, setIsAttendanceDialogOpen] = useState(false);
  const [isStatementDialogOpen, setIsStatementDialogOpen] = useState(false);
  const [editingLaborer, setEditingLaborer] = useState<Laborer | null>(null);
  const [editingRecord, setEditingRecord] = useState<LaborRecord | null>(null);
  const [selectedStatementLaborer, setSelectedStatementLaborer] = useState<Laborer | null>(null);
  const [isSettling, setIsSettling] = useState<string | null>(null);

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

  const laborerWorkDays = useMemo(() => {
    if (!records) return {};
    const counts: Record<string, number> = {};
    records.forEach(rec => {
      if (rec.category !== 'Advance') {
        counts[rec.laborerId] = (counts[rec.laborerId] || 0) + 1;
      }
    });
    return counts;
  }, [records]);

  const filteredLaborers = laborers?.filter(l => 
    l.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const filteredRecords = records?.filter(r => {
    const matchesSearch = r.laborerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         r.workDescription?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         r.siteName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLaborer = filterLaborerId === 'all' || r.laborerId === filterLaborerId;
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    
    let matchesDate = true;
    if (dateFilter !== 'all') {
      const recordDate = new Date(`${r.date}T00:00:00`);
      const now = new Date();
      if (dateFilter === 'today') {
        matchesDate = r.date === format(now, 'yyyy-MM-dd');
      } else if (dateFilter === 'week') {
        matchesDate = isWithinInterval(recordDate, { start: startOfWeek(now), end: endOfDay(now) });
      } else if (dateFilter === 'month') {
        matchesDate = isWithinInterval(recordDate, { start: startOfMonth(now), end: endOfDay(now) });
      }
    }

    return matchesSearch && matchesLaborer && matchesDate && matchesStatus;
  }) || [];

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

  const handleOpenStatement = (laborer: Laborer) => {
    setSelectedStatementLaborer(laborer);
    setIsStatementDialogOpen(true);
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

  const handleSettleAllDues = async (laborerId: string, laborerName: string) => {
    if (!firestore || !user) return;
    const balance = laborerBalances[laborerId] || 0;
    if (balance <= 0) {
      toast({ title: "No Dues", description: `${laborerName} has no pending dues.` });
      return;
    }

    if (!confirm(`Mark all pending dues (Rs ${balance.toLocaleString()}) for ${laborerName} as Paid?`)) return;

    setIsSettling(laborerId);
    try {
      const batch = writeBatch(firestore);
      const pendingRecordsQuery = query(
        collection(firestore, `users/${user.uid}/laborRecords`),
        where('laborerId', '==', laborerId),
        where('status', '==', 'Pending')
      );
      
      const snap = await getDocs(pendingRecordsQuery);
      snap.docs.forEach(d => {
        batch.update(d.ref, { status: 'Paid', updatedAt: new Date().toISOString() });
      });
      
      await batch.commit();
      toast({ title: "Dues Settled", description: `All pending records for ${laborerName} marked as Paid.` });
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: "Failed to settle dues." });
    } finally {
      setIsSettling(null);
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
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => setIsAttendanceDialogOpen(true)} className="h-10 border-primary text-primary hover:bg-primary/5">
                <CheckSquare className="mr-2 h-4 w-4" />
                Quick Attendance
              </Button>
              <Button variant="outline" onClick={handleAddLaborer} className="h-10">
                <Plus className="mr-2 h-4 w-4" />
                Add Laborer
              </Button>
              <Button onClick={handleAddRecord} className="h-10">
                <Calendar className="mr-2 h-4 w-4" />
                New Record
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-l-4 border-l-primary shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Paid</p>
                    <p className="text-2xl font-bold text-primary">{formatCurrency(stats.paid)}</p>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Wallet className="h-5 w-5 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-orange-500 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Outstanding</p>
                    <p className="text-2xl font-bold text-orange-500">{formatCurrency(stats.pending)}</p>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                    <Clock className="h-5 w-5 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Active Workers</p>
                    <p className="text-2xl font-bold text-blue-500">{laborers?.length || 0}</p>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="records" className="space-y-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-muted/30 p-2 rounded-xl border">
              <TabsList className="bg-transparent">
                <TabsTrigger value="records" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Work Records</TabsTrigger>
                <TabsTrigger value="laborers" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Laborer List</TabsTrigger>
              </TabsList>
              <div className="flex flex-1 items-center gap-2 w-full md:w-auto">
                <div className="relative flex-1 md:max-w-xs">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search site, worker, or task..." 
                    className="pl-9 h-9 bg-background" 
                    value={searchTerm} 
                    onChange={(e) => setSearchTerm(e.target.value)} 
                  />
                </div>
              </div>
            </div>

            <TabsContent value="records">
              <Card className="border-none shadow-sm ring-1 ring-border">
                <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <History className="h-5 w-5 text-primary" />
                      Work History
                    </CardTitle>
                    <CardDescription>Detailed log of daily tasks and payments.</CardDescription>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-2 bg-muted/50 px-2 py-1 rounded-md">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <Select value={dateFilter} onValueChange={setDateFilter}>
                        <SelectTrigger className="w-[110px] h-8 border-none bg-transparent shadow-none focus:ring-0 text-xs">
                          <SelectValue placeholder="Period" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Time</SelectItem>
                          <SelectItem value="today">Today</SelectItem>
                          <SelectItem value="week">This Week</SelectItem>
                          <SelectItem value="month">This Month</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-2 bg-muted/50 px-2 py-1 rounded-md">
                      <CircleDashed className="h-4 w-4 text-muted-foreground" />
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[100px] h-8 border-none bg-transparent shadow-none focus:ring-0 text-xs">
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Any Status</SelectItem>
                          <SelectItem value="Paid">Paid Only</SelectItem>
                          <SelectItem value="Pending">Pending Only</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-2 bg-muted/50 px-2 py-1 rounded-md">
                      <Filter className="h-4 w-4 text-muted-foreground" />
                      <Select value={filterLaborerId} onValueChange={setFilterLaborerId}>
                        <SelectTrigger className="w-[120px] h-8 border-none bg-transparent shadow-none focus:ring-0 text-xs">
                          <SelectValue placeholder="Worker" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Workers</SelectItem>
                          {laborers?.map(l => (
                            <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0 sm:p-6 sm:pt-0">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Laborer</TableHead>
                        <TableHead>Site / Task</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead className="text-center">Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRecords.map((record) => (
                        <TableRow key={record.id} className="group">
                          <TableCell className="font-medium">
                            <div className="flex flex-col">
                              <span>{format(new Date(`${record.date}T00:00:00`), 'dd MMM')}</span>
                              <span className="text-[10px] text-muted-foreground">{format(new Date(`${record.date}T00:00:00`), 'yyyy')}</span>
                            </div>
                          </TableCell>
                          <TableCell className="font-bold">{record.laborerName}</TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <div className="flex items-center gap-1.5 font-medium text-xs">
                                <MapPin className="h-3 w-3 text-primary opacity-60" />
                                {record.siteName || 'General Site'}
                              </div>
                              <div className="text-[10px] text-muted-foreground truncate max-w-[150px] italic">
                                {record.workDescription || '-'}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={
                              record.category === 'Full Day' ? 'text-blue-600 border-blue-200' :
                              record.category === 'Half Day' ? 'text-cyan-600 border-cyan-200' :
                              record.category === 'Advance' ? 'text-orange-600 border-orange-200' :
                              'text-purple-600 border-purple-200'
                            }>
                              {record.category || 'Full Day'}
                            </Badge>
                          </TableCell>
                          <TableCell className={`text-right font-bold ${record.category === 'Advance' ? 'text-orange-600' : 'text-primary'}`}>
                            {record.category === 'Advance' ? `-${formatCurrency(record.amount)}` : formatCurrency(record.amount)}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant={record.status === 'Paid' ? 'default' : 'outline'} className={record.status === 'Paid' ? 'bg-green-600' : 'text-orange-600 border-orange-200'}>
                              {record.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              {record.status === 'Pending' && (
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="text-green-600 h-8 w-8 hover:bg-green-50" 
                                  onClick={() => handleMarkAsPaid(record.id)}
                                  title="Mark as Paid"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                              )}
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditRecord(record)} title="Edit">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="text-destructive h-8 w-8 hover:bg-destructive/10" onClick={() => handleDeleteRecord(record.id)} title="Delete">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      {filteredRecords.length === 0 && !isLoadingRecords && (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-16">
                            <div className="flex flex-col items-center gap-2 text-muted-foreground">
                              <Calendar className="h-8 w-8 opacity-20" />
                              <p>No records found for the selected filters.</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="laborers">
              <Card className="border-none shadow-sm ring-1 ring-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserCheck className="h-5 w-5 text-primary" />
                    Team Roster
                  </CardTitle>
                  <CardDescription>Manage profiles and generate work statements.</CardDescription>
                </CardHeader>
                <CardContent className="p-0 sm:p-6 sm:pt-0">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead className="hidden sm:table-cell">Phone</TableHead>
                        <TableHead className="text-right">Daily Rate</TableHead>
                        <TableHead className="text-center">Work Days</TableHead>
                        <TableHead className="text-right">Pending Balance</TableHead>
                        <TableHead className="text-right">Quick Actions</TableHead>
                        <TableHead className="text-right">History</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLaborers.map((laborer) => {
                        const balance = laborerBalances[laborer.id] || 0;
                        const daysWorked = laborerWorkDays[laborer.id] || 0;
                        return (
                          <TableRow key={laborer.id}>
                            <TableCell className="font-bold">{laborer.name}</TableCell>
                            <TableCell className="hidden sm:table-cell text-muted-foreground">{laborer.phone || '-'}</TableCell>
                            <TableCell className="text-right">{formatCurrency(laborer.dailyRate)}</TableCell>
                            <TableCell className="text-center">
                              <Badge variant="secondary" className="font-mono">
                                {daysWorked}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <span className={balance > 0 ? "font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded" : "text-muted-foreground"}>
                                {formatCurrency(balance)}
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="h-8 text-xs border-primary text-primary hover:bg-primary/5"
                                  onClick={() => handleOpenStatement(laborer)}
                                >
                                  <FileText className="mr-1 h-3 w-3" />
                                  Statement
                                </Button>
                                {balance > 0 && (
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="h-8 text-xs border-green-600 text-green-600 hover:bg-green-600 hover:text-white transition-all"
                                    onClick={() => handleSettleAllDues(laborer.id, laborer.name)}
                                    disabled={isSettling === laborer.id}
                                  >
                                    {isSettling === laborer.id ? "..." : (
                                      <>
                                        <CreditCard className="mr-1 h-3 w-3" />
                                        Settle All
                                      </>
                                    )}
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8 text-primary" 
                                  onClick={() => {
                                    setFilterLaborerId(laborer.id);
                                    // Switch tabs if possible or just rely on state
                                  }}
                                  title="View Records"
                                >
                                  <ChevronRight className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditLaborer(laborer)} title="Edit">
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="text-destructive h-8 w-8" onClick={() => handleDeleteLaborer(laborer.id)} title="Delete">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
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

      <QuickAttendanceDialog
        isOpen={isAttendanceDialogOpen}
        onOpenChange={setIsAttendanceDialogOpen}
        laborers={laborers || []}
        userId={user.uid}
      />

      <LaborerStatementModal
        isOpen={isStatementDialogOpen}
        onOpenChange={setIsStatementDialogOpen}
        laborer={selectedStatementLaborer}
        records={records || []}
        userId={user.uid}
      />
      
      <footer className="container mx-auto py-6 px-4 text-center text-sm text-muted-foreground md:px-6 print:hidden">
        <p>&copy; {new Date().getFullYear()} Dubai Tools. Performance Tracker.</p>
      </footer>
    </div>
  );
}
