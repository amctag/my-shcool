import { PageHeader } from "@/components/dashboard/PageHeader";
import { GradeFormsTable } from "@/features/school/components/GradeFormsTable";

export default function GradeFormsPage() {
  return (
    <div>
      <PageHeader
        title="Grade form"
        description="Report card layouts by year, class, and grade format"
      />
      <GradeFormsTable />
    </div>
  );
}
