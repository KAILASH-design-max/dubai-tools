"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, FileJson, Loader2, AlertCircle } from 'lucide-react';
import { useFirestore } from '@/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export function DataManagement({ userId }: { userId: string }) {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);

  const exportCollection = async (collectionName: string) => {
    if (!firestore || !userId) return;
    setIsExporting(true);
    
    try {
      const colRef = collection(firestore, `users/${userId}/${collectionName}`);
      const snapshot = await getDocs(colRef);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${collectionName}_export_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Export Successful",
        description: `Exported ${data.length} records from ${collectionName}.`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Export Failed",
        description: `Failed to export ${collectionName}.`,
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Account Portability</AlertTitle>
        <AlertDescription>
          Download your data at any time. These files contain your raw business records in JSON format.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Button 
          variant="outline" 
          className="h-24 flex flex-col items-center justify-center gap-2 hover:bg-primary/5 hover:text-primary transition-all"
          onClick={() => exportCollection('invoices')}
          disabled={isExporting}
        >
          {isExporting ? <Loader2 className="h-6 w-6 animate-spin" /> : <Download className="h-6 w-6" />}
          <div className="text-center">
            <p className="text-sm font-bold">Export Invoices</p>
            <p className="text-[10px] opacity-60">All history & line items</p>
          </div>
        </Button>

        <Button 
          variant="outline" 
          className="h-24 flex flex-col items-center justify-center gap-2 hover:bg-primary/5 hover:text-primary transition-all"
          onClick={() => exportCollection('inventory')}
          disabled={isExporting}
        >
          {isExporting ? <Loader2 className="h-6 w-6 animate-spin" /> : <Download className="h-6 w-6" />}
          <div className="text-center">
            <p className="text-sm font-bold">Export Inventory</p>
            <p className="text-[10px] opacity-60">Products, stock & pricing</p>
          </div>
        </Button>

        <Button 
          variant="outline" 
          className="h-24 flex flex-col items-center justify-center gap-2 hover:bg-primary/5 hover:text-primary transition-all"
          onClick={() => exportCollection('customers')}
          disabled={isExporting}
        >
          {isExporting ? <Loader2 className="h-6 w-6 animate-spin" /> : <Download className="h-6 w-6" />}
          <div className="text-center">
            <p className="text-sm font-bold">Export Customers</p>
            <p className="text-[10px] opacity-60">Client contact database</p>
          </div>
        </Button>

        <Button 
          variant="outline" 
          className="h-24 flex flex-col items-center justify-center gap-2 hover:bg-primary/5 hover:text-primary transition-all"
          onClick={() => exportCollection('laborRecords')}
          disabled={isExporting}
        >
          {isExporting ? <Loader2 className="h-6 w-6 animate-spin" /> : <Download className="h-6 w-6" />}
          <div className="text-center">
            <p className="text-sm font-bold">Export Labor Records</p>
            <p className="text-[10px] opacity-60">Daily wages & attendance</p>
          </div>
        </Button>
      </div>
    </div>
  );
}
