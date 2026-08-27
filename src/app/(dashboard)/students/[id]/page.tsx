import Link from "next/link";
import { StudentForm } from "@/features/school/components/StudentForm";

export default async function ViewStudentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const studentId = Number(id);

  return (
    <div className="space-y-4">
      <Link
        href="/students"
        className="inline-flex min-h-11 items-center text-sm font-medium text-primary hover:text-primary-hover"
      >
        Back to students
      </Link>
      {Number.isInteger(studentId) && studentId > 0 ? (
        <StudentForm studentId={studentId} readOnly />
      ) : (
        <p className="text-sm text-red-600">Invalid student id.</p>
      )}
    </div>
  );
}
