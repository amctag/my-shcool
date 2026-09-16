import { BackLink } from "@/components/dashboard/BackLink";
import { TeacherForm } from "@/features/school/components/TeacherForm";

export default function AddTeacherPage() {
  return (
    <div className="space-y-4">
      <BackLink
        href="/teachers"
      >
        Back to teachers
      </BackLink>
      <TeacherForm />
    </div>
  );
}
