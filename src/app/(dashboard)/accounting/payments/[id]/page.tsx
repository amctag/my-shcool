import { BackLink } from "@/components/dashboard/BackLink";
import { AccountingDocumentDetail } from "@/features/school/components/AccountingDocumentDetail";

export default async function PaymentDetailPage({
  params,
}: PageProps<"/accounting/payments/[id]">) {
  const { id } = await params;
  return (
    <div className="space-y-4">
      <BackLink href="/accounting/payments">Back to payments</BackLink>
      <AccountingDocumentDetail kind="payment" id={Number(id)} />
    </div>
  );
}
