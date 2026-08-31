import Link from "next/link";
import { Pencil } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { ExamScheduleView } from "@/features/school/components/ExamScheduleView";

type ViewExamSchedulePageProps = {
  searchParams: Promise<{
    scheduleId?: string;
    saved?: string;
  }>;
};

export default async function ViewExamSchedulePage({
  searchParams,
}: ViewExamSchedulePageProps) {
  const params = await searchParams;
  const scheduleId = Number(params.scheduleId);
  const valid = scheduleId > 0;
  const saved = params.saved === "1";

  return (
    <div className="space-y-4">
      <Link
        href="/exams"
        className="inline-flex min-h-11 items-center text-sm font-medium text-primary hover:text-primary-hover"
      >
        Back to exam schedules
      </Link>
      <PageHeader
        title="Exam schedule details"
        description="View exam dates, courses, and times"
      />
      {valid ? (
        <>
          {saved ? (
            <p
              className="rounded-2xl border border-green-200 bg-green-50 px-5 py-4 text-sm text-green-800"
              role="status"
            >
              Exam schedule saved successfully.
            </p>
          ) : null}
          <div className="flex justify-end">
            <Link
              href={`/exams/edit?scheduleId=${scheduleId}`}
              className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-on-primary hover:bg-primary-hover"
            >
              <Pencil aria-hidden className="h-4 w-4" />
              Edit schedule
            </Link>
          </div>
          <ExamScheduleView scheduleId={scheduleId} />
        </>
      ) : (
        <p className="rounded-2xl border border-border bg-white px-6 py-10 text-center text-sm text-muted">
          Missing schedule information. Go back and open a schedule from the list.
        </p>
      )}
    </div>
  );
}
