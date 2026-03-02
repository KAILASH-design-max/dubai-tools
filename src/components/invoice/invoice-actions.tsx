"use client";

import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Printer, Save } from "lucide-react";

export const InvoiceActions = ({ onSave }: { onSave: () => void; }) => {
  const { toast } = useToast();

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    } else {
      toast({ title: "Print", description: "Printing is only available in a browser environment." });
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-end gap-2 print:hidden">
      <Button variant="outline" size="sm" onClick={handlePrint}>
        <Printer />
        <span className="ml-2 hidden md:inline">Print</span>
      </Button>
      <Button size="sm" onClick={onSave}>
        <Save />
        <span className="ml-2 hidden md:inline">Save Invoice</span>
      </Button>
    </div>
  );
};
