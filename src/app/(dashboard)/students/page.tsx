import { PageHeader } from "@/components/dashboard/PageHeader";
import { StudentsTable } from "@/features/school/components/StudentsTable";

export default function StudentsPage() {
  return (
    <div>
      <PageHeader
        title="Students"
        description="Student records for this school"
      />
      <StudentsTable />
    </div>
  );
}
