import { PageHeader } from "@/components/dashboard/PageHeader";
import { ClassesTable } from "@/features/school/components/ClassesTable";

export default function ClassesPage() {
  return (
    <div>
      <PageHeader
        title="Classes"
        description="Standard classes for this school"
      />
      <ClassesTable />
    </div>
  );
}
