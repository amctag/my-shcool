import { BackLink } from "@/components/dashboard/BackLink";
import { AccountForm } from "@/features/school/components/AccountForm";

export default function AddAccountPage() {
  return (
    <div className="space-y-4">
      <BackLink href="/accounting/accounts">Back to accounts</BackLink>
      <AccountForm />
    </div>
  );
}
