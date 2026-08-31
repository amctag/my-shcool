import { Suspense } from "react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { ExamSchedulesTable } from "@/features/school/components/ExamSchedulesTable";

export default function ExamsPage() {
  return (
    <div>
      <PageHeader
        title="Exam schedules"
        description="Manage exam dates and times by class"
      />
      <Suspense
        fallback={
          <p className="rounded-2xl border border-border bg-white px-6 py-10 text-center text-sm text-muted">
            Loading exam schedules…
          </p>
        }
      >
        <ExamSchedulesTable />
      </Suspense>
    </div>
  );
}
