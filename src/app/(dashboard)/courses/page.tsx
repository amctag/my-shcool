import { PageHeader } from "@/components/dashboard/PageHeader";
import { CoursesTable } from "@/features/school/components/CoursesTable";

export default function CoursesPage() {
  return (
    <div>
      <PageHeader
        title="Courses"
        description="Subjects taught at this school"
      />
      <CoursesTable />
    </div>
  );
}
