import { BackLink } from "@/components/dashboard/BackLink";
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
      <BackLink
        href="/teachers"
      >
        Back to teachers
      </BackLink>
      {Number.isInteger(teacherId) && teacherId > 0 ? (
        <TeacherForm teacherId={teacherId} />
      ) : (
        <p className="text-sm text-red-600">Invalid teacher id.</p>
      )}
    </div>
  );
}
