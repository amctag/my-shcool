import { PageHeader } from "@/components/dashboard/PageHeader";
import { ReceiptsList } from "@/features/school/components/ReceiptsList";

export default function ReceiptsPage() {
  return (
    <div>
      <PageHeader
        title="Receipts"
        description="Track money received by the school from parents"
      />
      <ReceiptsList />
    </div>
  );
}
