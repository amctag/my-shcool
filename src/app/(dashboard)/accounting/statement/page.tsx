import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatementOfAccount } from "@/features/school/components/StatementOfAccount";

export default function StatementPage() {
  return (
    <div>
      <PageHeader
        title="Statement of Account"
        description="Journal-based account movements with running balances"
      />
      <StatementOfAccount />
    </div>
  );
}
