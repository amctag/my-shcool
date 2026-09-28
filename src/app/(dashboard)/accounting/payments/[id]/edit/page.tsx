import { BackLink } from "@/components/dashboard/BackLink";
import { AccountingDocumentEditForm } from "@/features/school/components/AccountingDocumentEditForm";
export default async function Page({
  params,
}: PageProps<"/accounting/payments/[id]/edit">) {
  const { id } = await params;
  return (
    <div className="space-y-4">
      <BackLink href={`/accounting/payments/${id}`}>Back to payment</BackLink>
      <AccountingDocumentEditForm kind="payment" id={Number(id)} />
    </div>
  );
}
