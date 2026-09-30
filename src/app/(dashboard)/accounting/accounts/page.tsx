import { PageHeader } from "@/components/dashboard/PageHeader";
import { ChartOfAccounts } from "@/features/school/components/ChartOfAccounts";

export default function AccountsPage() {
  return (
    <div>
      <PageHeader
        title="Chart of Accounts"
        description="Hierarchical chart of accounts for this school: expand roots to reveal children, select an account for details"
      />
      <ChartOfAccounts />
    </div>
  );
}
