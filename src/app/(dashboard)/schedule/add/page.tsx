import { BackLink } from "@/components/dashboard/BackLink";
import { Suspense } from "react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { WeeklyScheduleForm } from "@/features/school/components/WeeklyScheduleForm";

export default function AddWeeklySchedulePage() {
  return (
    <div className="space-y-4">
      <BackLink
        href="/schedule"
      >
        Back to weekly schedule
      </BackLink>
      <PageHeader
        title="Add weekly schedule"
        description="Choose class and section, then assign courses to each period"
      />
      <Suspense
        fallback={
          <p className="rounded-2xl border border-border bg-white px-6 py-10 text-center text-sm text-muted">
            Loading form…
          </p>
        }
      >
        <WeeklyScheduleForm />
      </Suspense>
    </div>
  );
}
