import { PageHeader } from "@/components/dashboard/PageHeader";
import { InvoicesList } from "@/features/school/components/InvoicesList";

export default function InvoicesPage() {
  return (
    <div>
      <PageHeader
        title="Invoices"
        description="Parent invoices with balanced parent-debit / sales-credit journals"
      />
      <InvoicesList />
    </div>
  );
}
