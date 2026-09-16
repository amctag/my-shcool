import { BackLink } from "@/components/dashboard/BackLink";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { TakeAttendanceForm } from "@/features/school/components/TakeAttendanceForm";

export default async function EditAttendancePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const attendanceId = Number(id);
  const valid = Number.isInteger(attendanceId) && attendanceId > 0;

  return (
    <div className="space-y-4">
      <BackLink href={valid ? `/attendance/${attendanceId}` : "/attendance"}>
        Back to attendance
      </BackLink>
      <PageHeader
        title="Edit attendance"
        description="Update present / absent marks and absence reasons"
      />
      {valid ? (
        <TakeAttendanceForm attendanceId={attendanceId} />
      ) : (
        <p className="text-sm text-red-600">Invalid attendance id.</p>
      )}
    </div>
  );
}
