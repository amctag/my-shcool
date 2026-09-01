import { PageHeader } from "@/components/dashboard/PageHeader";
import { GradesByTypeTable } from "@/features/school/components/GradesByTypeTable";

export default function GradesByTypePage() {
  return (
    <div>
      <PageHeader
        title="Grade by type"
        description="Grade types used across courses and exams"
      />
      <GradesByTypeTable />
    </div>
  );
}
