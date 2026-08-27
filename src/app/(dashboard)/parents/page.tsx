import { PageHeader } from "@/components/dashboard/PageHeader";
import { ParentsTable } from "@/features/school/components/ParentsTable";

export default function ParentsPage() {
  return (
    <div>
      <PageHeader
        title="Parents"
        description="Parent records for this school"
      />
      <ParentsTable />
    </div>
  );
}
