import { BackLink } from "@/components/dashboard/BackLink";
import { ReceiptForm } from "@/features/school/components/ReceiptForm";

export default function AddReceiptPage() {
  return (
    <div className="space-y-4">
      <BackLink href="/accounting/receipts">Back to receipts</BackLink>
      <ReceiptForm />
    </div>
  );
}
