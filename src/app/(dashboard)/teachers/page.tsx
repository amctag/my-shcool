import { PageHeader } from "@/components/dashboard/PageHeader";
import { TeachersTable } from "@/features/school/components/TeachersTable";

export default function TeachersPage() {
  return (
    <div>
      <PageHeader
        title="Teachers"
        description="Teacher records for this school"
      />
      <TeachersTable />
    </div>
  );
}
