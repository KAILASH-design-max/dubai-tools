"use client";

import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Download, Send, WandSparkles, Printer } from "lucide-react";
import type { FC } from 'react';

type InvoiceActionsProps = {
  onGetAiSuggestions: () => void;
};

export const InvoiceActions: FC<InvoiceActionsProps> = ({ onGetAiSuggestions }) => {
  const { toast } = useToast();

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    } else {
      toast({ title: "Print", description: "Printing is only available in a browser environment." });
    }
  };

  const handleDownload = () => {
    toast({ variant: 'destructive', title: "Feature Not Available", description: "PDF download functionality is not implemented." });
  };

  const handleSend = () => {
    toast({ variant: 'destructive', title: "Feature Not Available", description: "Email functionality is not implemented." });
  };

  return (
    <div className="flex flex-wrap items-center justify-end gap-2 print:hidden">
      <Button variant="outline" size="sm" onClick={onGetAiSuggestions}>
        <WandSparkles />
        <span className="ml-2 hidden md:inline">AI Suggestions</span>
      </Button>
      <Button variant="outline" size="sm" onClick={handlePrint}>
        <Printer />
        <span className="ml-2 hidden md:inline">Print</span>
      </Button>
      <Button variant="outline" size="sm" onClick={handleDownload}>
        <Download />
        <span className="ml-2 hidden md:inline">Download</span>
      </Button>
      <Button size="sm" onClick={handleSend}>
        <Send />
        <span className="ml-2 hidden md:inline">Send Invoice</span>
      </Button>
    </div>
  );
};
