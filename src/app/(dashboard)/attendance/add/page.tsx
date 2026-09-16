import { BackLink } from "@/components/dashboard/BackLink";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { TakeAttendanceForm } from "@/features/school/components/TakeAttendanceForm";

export default function AddAttendancePage() {
  return (
    <div className="space-y-4">
      <BackLink
        href="/attendance"
      >
        Back to attendance
      </BackLink>
      <PageHeader
        title="Add attendance"
        description="Choose class, section, and date, then mark each student present or absent"
      />
      <TakeAttendanceForm />
    </div>
  );
}
