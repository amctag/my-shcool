import { PageHeader } from "@/components/dashboard/PageHeader";
import { GradesByCourseTable } from "@/features/school/components/GradesByCourseTable";

export default function GradesByCoursePage() {
  return (
    <div>
      <PageHeader
        title="Grade by course"
        description="Course grade sheets by year, section, and grade type"
      />
      <GradesByCourseTable />
    </div>
  );
}
