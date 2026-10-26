import { BackLink } from "@/components/dashboard/BackLink";
import { AccountingDocumentEditForm } from "@/features/school/components/AccountingDocumentEditForm";
export default async function EditRecordPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <div className="space-y-4"><BackLink href={`/accounting/records/${id}`}>Back to record</BackLink><AccountingDocumentEditForm kind="record" id={Number(id)} /></div>;
}
