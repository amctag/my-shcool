import { BackLink } from "@/components/dashboard/BackLink";
import { PaymentForm } from "@/features/school/components/PaymentForm";

export default function AddPaymentPage() {
  return (
    <div className="space-y-4">
      <BackLink href="/accounting/payments">Back to payments</BackLink>
      <PaymentForm />
    </div>
  );
}
