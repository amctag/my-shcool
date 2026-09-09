import { PageHeader } from "@/components/dashboard/PageHeader";
import { NoticeTypesTable } from "@/features/school/components/NoticeTypesTable";

export default function NoticeTypesPage() {
  return (
    <div>
      <PageHeader
        title="Notice types"
        description="Manage types used when creating notices"
      />
      <NoticeTypesTable />
    </div>
  );
}
