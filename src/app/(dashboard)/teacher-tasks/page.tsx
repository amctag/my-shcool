import { PageHeader } from "@/components/dashboard/PageHeader";
import { TeacherTasksList } from "@/features/school/components/TeacherTasksList";

export default function TeacherTasksPage() {
  return (
    <div>
      <PageHeader
        title="Teacher tasks"
        description="Assign tasks to all teachers and notify them"
      />
      <TeacherTasksList />
    </div>
  );
}
