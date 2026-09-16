import { BackLink } from "@/components/dashboard/BackLink";
import { AttendanceReasonForm } from "@/features/school/components/AttendanceReasonForm";

export default async function EditAttendanceReasonPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const reasonId = Number(id);

  return (
    <div className="space-y-4">
      <BackLink
        href="/attendance/reasons"
      >
        Back to reasons
      </BackLink>
      {Number.isInteger(reasonId) && reasonId > 0 ? (
        <AttendanceReasonForm reasonId={reasonId} />
      ) : (
        <p className="text-sm text-red-600">Invalid attendance reason id.</p>
      )}
    </div>
  );
}
