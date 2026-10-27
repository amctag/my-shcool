import { PageHeader } from "@/components/dashboard/PageHeader";
import { DirectorsTable } from "@/features/school/components/DirectorsTable";

export default function DirectorsPage() {
  return (
    <div>
      <PageHeader
        title="Directors"
        description="Director records for this school"
      />
      <DirectorsTable />
    </div>
  );
}
