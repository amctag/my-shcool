import { BackLink } from "@/components/dashboard/BackLink";
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
      <BackLink
        href="/students"
      >
        Back to students
      </BackLink>
      {Number.isInteger(studentId) && studentId > 0 ? (
        <StudentForm studentId={studentId} readOnly />
      ) : (
        <p className="text-sm text-red-600">Invalid student id.</p>
      )}
    </div>
  );
}
