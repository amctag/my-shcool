import { PageHeader } from "@/components/dashboard/PageHeader";
import { AccountsList } from "@/features/school/components/AccountsList";

export default function AccountsPage() {
  return (
    <div>
      <PageHeader
        title="Accounts"
        description="Chart of accounts for this school, including person, system, and bank accounts"
      />
      <AccountsList />
    </div>
  );
}
