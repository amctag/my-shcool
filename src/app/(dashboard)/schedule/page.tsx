import { Suspense } from "react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { WeeklySchedulesTable } from "@/features/school/components/WeeklySchedulesTable";

export default function SchedulePage() {
  return (
    <div>
      <PageHeader
        title="Week schedule"
        description="Manage weekly class schedules by year, class, and section"
      />
      <Suspense
        fallback={
          <p className="rounded-2xl border border-border bg-white px-6 py-10 text-center text-sm text-muted">
            Loading schedules…
          </p>
        }
      >
        <WeeklySchedulesTable />
      </Suspense>
    </div>
  );
}
