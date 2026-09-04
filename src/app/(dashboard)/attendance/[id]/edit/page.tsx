import Link from "next/link";
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
      <Link
        href={valid ? `/attendance/${attendanceId}` : "/attendance"}
        className="inline-flex min-h-11 items-center text-sm font-medium text-primary hover:text-primary-hover"
      >
        Back to attendance
      </Link>
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
