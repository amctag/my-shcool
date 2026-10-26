import { BackLink } from "@/components/dashboard/BackLink";
import { AccountingDocumentEditForm } from "@/features/school/components/AccountingDocumentEditForm";
export default async function EditInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <div className="space-y-4"><BackLink href={`/accounting/invoices/${id}`}>Back to invoice</BackLink><AccountingDocumentEditForm kind="invoice" id={Number(id)} /></div>;
}
