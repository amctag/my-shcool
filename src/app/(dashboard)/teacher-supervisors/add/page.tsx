import { BackLink } from "@/components/dashboard/BackLink";
import { TeacherSupervisorForm } from "@/features/school/components/TeacherSupervisorForm";

export default function AddTeacherSupervisorPage() {
  return (
    <div className="space-y-4">
      <BackLink href="/teacher-supervisors">Back to supervisors</BackLink>
      <TeacherSupervisorForm />
    </div>
  );
}
