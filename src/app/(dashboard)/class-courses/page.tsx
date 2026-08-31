import { PageHeader } from "@/components/dashboard/PageHeader";
import { ClassCoursesTable } from "@/features/school/components/ClassCoursesTable";

export default function ClassCoursesPage() {
  return (
    <div>
      <PageHeader
        title="Classes & Courses"
        description="Courses assigned to each class for a school year"
      />
      <ClassCoursesTable />
    </div>
  );
}
