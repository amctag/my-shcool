import { BackLink } from "@/components/dashboard/BackLink";
import { AccountingDocumentDetail } from "@/features/school/components/AccountingDocumentDetail";

export default async function ReceiptDetailPage({
  params,
}: PageProps<"/accounting/receipts/[id]">) {
  const { id } = await params;
  return (
    <div className="space-y-4">
      <BackLink href="/accounting/receipts">Back to receipts</BackLink>
      <AccountingDocumentDetail kind="receipt" id={Number(id)} />
    </div>
  );
}
