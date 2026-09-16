import { BackLink } from "@/components/dashboard/BackLink";
import { AttendanceReasonForm } from "@/features/school/components/AttendanceReasonForm";

export default function AddAttendanceReasonPage() {
  return (
    <div className="space-y-4">
      <BackLink
        href="/attendance/reasons"
      >
        Back to reasons
      </BackLink>
      <AttendanceReasonForm />
    </div>
  );
}
