"use client";

import { Button } from "@/components/ui/button";
import { Printer, ReceiptText } from "lucide-react";

interface InvoiceActionsProps {
  onPrintA4: () => void;
  onPrintReceipt: () => void;
  isSaving?: boolean;
}

export const InvoiceActions = ({ onPrintA4, onPrintReceipt, isSaving }: InvoiceActionsProps) => {
  return (
    <div className="flex flex-wrap items-center justify-end gap-2 print:hidden">
      <Button 
        variant="outline" 
        size="sm" 
        onClick={onPrintA4} 
        disabled={isSaving}
        className="h-9"
      >
        <Printer className="mr-2 h-4 w-4 text-primary" />
        <span className="hidden md:inline">Print A4</span>
      </Button>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={onPrintReceipt} 
        disabled={isSaving}
        className="h-9"
      >
        <ReceiptText className="mr-2 h-4 w-4 text-primary" />
        <span className="hidden md:inline">Receipt (80mm)</span>
      </Button>
    </div>
  );
};
