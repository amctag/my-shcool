import Link from "next/link";
import { TeacherForm } from "@/features/school/components/TeacherForm";

export default async function EditTeacherPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const teacherId = Number(id);

  return (
    <div className="space-y-4">
      <Link
        href="/teachers"
        className="inline-flex min-h-11 items-center text-sm font-medium text-primary hover:text-primary-hover"
      >
        Back to teachers
      </Link>
      {Number.isInteger(teacherId) && teacherId > 0 ? (
        <TeacherForm teacherId={teacherId} />
      ) : (
        <p className="text-sm text-red-600">Invalid teacher id.</p>
      )}
    </div>
  );
}
