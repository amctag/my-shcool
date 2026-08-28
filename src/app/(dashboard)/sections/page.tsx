import { PageHeader } from "@/components/dashboard/PageHeader";
import { SectionsTable } from "@/features/school/components/SectionsTable";

export default function SectionsPage() {
  return (
    <div>
      <PageHeader
        title="Sections"
        description="Class sections for this school year"
      />
      <SectionsTable />
    </div>
  );
}
