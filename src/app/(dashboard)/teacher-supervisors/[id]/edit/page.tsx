import { BackLink } from "@/components/dashboard/BackLink";
import { TeacherSupervisorForm } from "@/features/school/components/TeacherSupervisorForm";

export default async function EditTeacherSupervisorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supervisorId = Number(id);

  return (
    <div className="space-y-4">
      <BackLink href="/teacher-supervisors">Back to supervisors</BackLink>
      {Number.isInteger(supervisorId) && supervisorId > 0 ? (
        <TeacherSupervisorForm supervisorId={supervisorId} />
      ) : (
        <p className="text-sm text-red-600">Invalid supervisor id.</p>
      )}
    </div>
  );
}
