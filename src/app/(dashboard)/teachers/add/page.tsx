import Link from "next/link";
import { TeacherForm } from "@/features/school/components/TeacherForm";

export default function AddTeacherPage() {
  return (
    <div className="space-y-4">
      <Link
        href="/teachers"
        className="inline-flex min-h-11 items-center text-sm font-medium text-primary hover:text-primary-hover"
      >
        Back to teachers
      </Link>
      <TeacherForm />
    </div>
  );
}
