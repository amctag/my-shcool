import { BackLink } from "@/components/dashboard/BackLink";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { InvoiceForm } from "@/features/school/components/InvoiceForm";

export default function AddInvoicePage() {
  return (
    <div className="space-y-4">
      <BackLink href="/accounting/invoices">Back to invoices</BackLink>
      <PageHeader
        title="New invoice"
        description="Bill a parent manually with optional per-line student registrations"
      />
      <InvoiceForm />
    </div>
  );
}
