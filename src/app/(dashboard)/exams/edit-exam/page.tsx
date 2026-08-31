import Link from "next/link";
import { Suspense } from "react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { ExamScheduleMetadataForm } from "@/features/school/components/ExamScheduleMetadataForm";

type EditExamPageProps = {
  searchParams: Promise<{
    scheduleId?: string;
  }>;
};

export default async function EditExamPage({ searchParams }: EditExamPageProps) {
  const params = await searchParams;
  const scheduleId = Number(params.scheduleId);
  const valid = scheduleId > 0;

  return (
    <div className="space-y-4">
      <Link
        href="/exams"
        className="inline-flex min-h-11 items-center text-sm font-medium text-primary hover:text-primary-hover"
      >
        Back to exam schedules
      </Link>
      <PageHeader
        title="Edit exam"
        description="Update title, class, grade type, and note"
      />
      {valid ? (
        <Suspense
          fallback={
            <p className="rounded-2xl border border-border bg-white px-6 py-10 text-center text-sm text-muted">
              Loading form…
            </p>
          }
        >
          <ExamScheduleMetadataForm scheduleId={scheduleId} />
        </Suspense>
      ) : (
        <p className="rounded-2xl border border-border bg-white px-6 py-10 text-center text-sm text-muted">
          Missing exam information. Go back and open an exam from the list.
        </p>
      )}
    </div>
  );
}
