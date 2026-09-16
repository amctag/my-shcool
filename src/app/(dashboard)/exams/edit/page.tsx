import { BackLink } from "@/components/dashboard/BackLink";
import { Suspense } from "react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { ExamScheduleForm } from "@/features/school/components/ExamScheduleForm";

type EditExamSchedulePageProps = {
  searchParams: Promise<{
    scheduleId?: string;
  }>;
};

export default async function EditExamSchedulePage({
  searchParams,
}: EditExamSchedulePageProps) {
  const params = await searchParams;
  const scheduleId = Number(params.scheduleId);
  const valid = scheduleId > 0;

  return (
    <div className="space-y-4">
      <BackLink
        href="/exams"
      >
        Back to exam schedules
      </BackLink>
      <PageHeader
        title="Exam timetable"
        description="Add exam date, courses, and times for this exam"
      />
      {valid ? (
        <Suspense
          fallback={
            <p className="rounded-2xl border border-border bg-white px-6 py-10 text-center text-sm text-muted">
              Loading form…
            </p>
          }
        >
          <ExamScheduleForm scheduleId={scheduleId} />
        </Suspense>
      ) : (
        <p className="rounded-2xl border border-border bg-white px-6 py-10 text-center text-sm text-muted">
          Missing schedule information. Go back and open a schedule from the list.
        </p>
      )}
    </div>
  );
}
