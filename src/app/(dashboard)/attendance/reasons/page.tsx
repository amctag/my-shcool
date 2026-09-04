import { PageHeader } from "@/components/dashboard/PageHeader";
import { AttendanceReasonsTable } from "@/features/school/components/AttendanceReasonsTable";

export default function AttendanceReasonsPage() {
  return (
    <div>
      <PageHeader
        title="Attendance reasons"
        description="Manage absence reasons used when taking attendance"
      />
      <AttendanceReasonsTable />
    </div>
  );
}
