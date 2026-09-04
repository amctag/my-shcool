import { Suspense } from "react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { AttendancesTable } from "@/features/school/components/AttendancesTable";

export default function AttendancePage() {
  return (
    <div>
      <PageHeader
        title="Attendance"
        description="Take and review daily attendance by class and section"
      />
      <Suspense
        fallback={
          <p className="rounded-2xl border border-border bg-white px-6 py-10 text-center text-sm text-muted">
            Loading attendance…
          </p>
        }
      >
        <AttendancesTable />
      </Suspense>
    </div>
  );
}
