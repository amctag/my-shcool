import { BackLink } from "@/components/dashboard/BackLink";
import { TeacherTaskForm } from "@/features/school/components/TeacherTaskForm";

export default function AddTeacherTaskPage() {
  return (
    <div className="space-y-4">
      <BackLink href="/teacher-tasks">Back to teacher tasks</BackLink>
      <TeacherTaskForm />
    </div>
  );
}
