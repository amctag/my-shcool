import { BackLink } from "@/components/dashboard/BackLink";
import { AccountingDocumentEditForm } from "@/features/school/components/AccountingDocumentEditForm";
export default async function Page({
  params,
}: PageProps<"/accounting/receipts/[id]/edit">) {
  const { id } = await params;
  return (
    <div className="space-y-4">
      <BackLink href={`/accounting/receipts/${id}`}>Back to receipt</BackLink>
      <AccountingDocumentEditForm kind="receipt" id={Number(id)} />
    </div>
  );
}
