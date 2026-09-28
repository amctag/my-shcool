import { BackLink } from "@/components/dashboard/BackLink";
import { InvoiceDetail } from "@/features/school/components/InvoiceDetail";

export default async function InvoiceDetailPage({
  params,
}: PageProps<"/accounting/invoices/[id]">) {
  const { id } = await params;
  return (
    <div className="space-y-4">
      <BackLink href="/accounting/invoices">Back to invoices</BackLink>
      <InvoiceDetail id={Number(id)} />
    </div>
  );
}
