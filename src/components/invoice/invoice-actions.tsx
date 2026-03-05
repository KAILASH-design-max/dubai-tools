"use client";

import { Button } from "@/components/ui/button";
import { Printer, Save, Receipt } from "lucide-react";

interface InvoiceActionsProps {
  onSave: () => void;
  onPrintA4: () => void;
  onPrintReceipt: () => void;
  isSaving?: boolean;
}

export const InvoiceActions = ({ onSave, onPrintA4, onPrintReceipt, isSaving }: InvoiceActionsProps) => {
  return (
    <div className="flex flex-wrap items-center justify-end gap-2 print:hidden">
      <Button variant="outline" size="sm" onClick={onPrintA4}>
        <Printer className="mr-2 h-4 w-4" />
        <span className="hidden md:inline">Print A4</span>
      </Button>
      <Button variant="outline" size="sm" onClick={onPrintReceipt}>
        <Receipt className="mr-2 h-4 w-4" />
        <span className="hidden md:inline">Receipt (80mm)</span>
      </Button>
      <Button size="sm" onClick={onSave} disabled={isSaving}>
        <Save className="mr-2 h-4 w-4" />
        <span className="hidden md:inline">Save Invoice</span>
      </Button>
    </div>
  );
};
