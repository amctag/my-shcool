import { PageHeader } from "@/components/dashboard/PageHeader";
import { TeacherSupervisorsTable } from "@/features/school/components/TeacherSupervisorsTable";

export default function TeacherSupervisorsPage() {
  return (
    <div>
      <PageHeader
        title="Supervisors"
        description="Assign a teacher as supervisor of one or more classes"
      />
      <TeacherSupervisorsTable />
    </div>
  );
}
