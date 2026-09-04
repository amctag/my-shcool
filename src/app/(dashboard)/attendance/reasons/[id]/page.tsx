import Link from "next/link";
import { AttendanceReasonForm } from "@/features/school/components/AttendanceReasonForm";

export default async function ViewAttendanceReasonPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const reasonId = Number(id);

  return (
    <div className="space-y-4">
      <Link
        href="/attendance/reasons"
        className="inline-flex min-h-11 items-center text-sm font-medium text-primary hover:text-primary-hover"
      >
        Back to reasons
      </Link>
      {Number.isInteger(reasonId) && reasonId > 0 ? (
        <AttendanceReasonForm reasonId={reasonId} readOnly />
      ) : (
        <p className="text-sm text-red-600">Invalid attendance reason id.</p>
      )}
    </div>
  );
}
