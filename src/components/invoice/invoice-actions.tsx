"use client";

import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Send, Printer, Save } from "lucide-react";

export const InvoiceActions = ({ onSave }: { onSave: () => void; }) => {
  const { toast } = useToast();

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    } else {
      toast({ title: "Print", description: "Printing is only available in a browser environment." });
    }
  };

  const handleSend = () => {
    toast({ variant: 'destructive', title: "Feature Not Available", description: "Email functionality is not implemented." });
  };

  return (
    <div className="flex flex-wrap items-center justify-end gap-2 print:hidden">
      <Button variant="outline" size="sm" onClick={handlePrint}>
        <Printer />
        <span className="ml-2 hidden md:inline">Print</span>
      </Button>
      <Button variant="outline" size="sm" onClick={onSave}>
        <Save />
        <span className="ml-2 hidden md:inline">Save Invoice</span>
      </Button>
      <Button size="sm" onClick={handleSend}>
        <Send />
        <span className="ml-2 hidden md:inline">Send Invoice</span>
      </Button>
    </div>
  );
};
