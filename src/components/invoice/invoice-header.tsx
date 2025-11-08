import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type InvoiceHeaderProps = {
    invoiceNumber: string;
    onInvoiceNumberChange: (value: string) => void;
    invoiceDate: string;
    onInvoiceDateChange: (value: string) => void;
};

export function InvoiceHeader({ 
    invoiceNumber, onInvoiceNumberChange, 
    invoiceDate, onInvoiceDateChange 
}: InvoiceHeaderProps) {
  return (
    <div className="font-body grid sm:grid-cols-2 gap-4 w-full">
      <div>
        <h1 className="font-headline text-2xl font-bold text-primary">DUBAI TOOLS</h1>
        <address className="not-italic text-muted-foreground text-sm space-y-1">
            <p>Shivdhara, Darbharbhang, Bihar 846005</p>
            <p><strong>Phone:</strong> 9268863031, 7280944150</p>
            <p><strong>Email:</strong> duubaitools2025@gmail.com</p>
            <p><strong>GST / Reg. No.:</strong> [Your GST Number]</p>
        </address>
      </div>
      <div className="space-y-4 text-sm sm:text-right">
          <div className="grid grid-cols-2 sm:grid-cols-[1fr_auto] items-center gap-2">
              <Label htmlFor="invoiceNumber" className="sm:text-right">Invoice #</Label>
              <Input id="invoiceNumber" value={invoiceNumber} onChange={(e) => onInvoiceNumberChange(e.target.value)} className="sm:max-w-[150px]" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-[1fr_auto] items-center gap-2">
              <Label htmlFor="invoiceDate" className="sm:text-right">Invoice Date</Label>
              <Input id="invoiceDate" type="date" value={invoiceDate} onChange={(e) => onInvoiceDateChange(e.target.value)} className="sm:max-w-[150px]" />
          </div>
      </div>
    </div>
  );
}
