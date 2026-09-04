import Link from "next/link";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { TakeAttendanceForm } from "@/features/school/components/TakeAttendanceForm";

export default function AddAttendancePage() {
  return (
    <div className="space-y-4">
      <Link
        href="/attendance"
        className="inline-flex min-h-11 items-center text-sm font-medium text-primary hover:text-primary-hover"
      >
        Back to attendance
      </Link>
      <PageHeader
        title="Add attendance"
        description="Choose class, section, and date, then mark each student present or absent"
      />
      <TakeAttendanceForm />
    </div>
  );
}
