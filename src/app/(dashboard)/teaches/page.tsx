import { PageHeader } from "@/components/dashboard/PageHeader";
import { TeachesTable } from "@/features/school/components/TeachesTable";

export default function TeachesPage() {
  return (
    <div>
      <PageHeader
        title="Teach"
        description="Assign a teacher to a class section and course"
      />
      <TeachesTable />
    </div>
  );
}
