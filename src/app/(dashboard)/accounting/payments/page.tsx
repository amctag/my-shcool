import { PageHeader } from "@/components/dashboard/PageHeader";
import { PaymentsList } from "@/features/school/components/PaymentsList";

export default function PaymentsPage() {
  return (
    <div>
      <PageHeader
        title="Payments"
        description="Track money paid out of the school Cash account"
      />
      <PaymentsList />
    </div>
  );
}
