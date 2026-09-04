import Link from "next/link";
import { AttendanceReasonForm } from "@/features/school/components/AttendanceReasonForm";

export default function AddAttendanceReasonPage() {
  return (
    <div className="space-y-4">
      <Link
        href="/attendance/reasons"
        className="inline-flex min-h-11 items-center text-sm font-medium text-primary hover:text-primary-hover"
      >
        Back to reasons
      </Link>
      <AttendanceReasonForm />
    </div>
  );
}
