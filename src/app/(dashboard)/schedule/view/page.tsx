import Link from "next/link";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { WeeklyScheduleView } from "@/features/school/components/WeeklyScheduleView";

type ViewSchedulePageProps = {
  searchParams: Promise<{
    yearId?: string;
    classId?: string;
    sectionId?: string;
  }>;
};

export default async function ViewSchedulePage({
  searchParams,
}: ViewSchedulePageProps) {
  const params = await searchParams;
  const yearId = Number(params.yearId);
  const classId = Number(params.classId);
  const sectionId = Number(params.sectionId);
  const valid = yearId > 0 && classId > 0 && sectionId > 0;

  return (
    <div className="space-y-4">
      <Link
        href="/schedule"
        className="inline-flex min-h-11 items-center text-sm font-medium text-primary hover:text-primary-hover"
      >
        Back to weekly schedule
      </Link>
      <PageHeader
        title="Weekly schedule details"
        description="View class sessions and courses"
      />
      {valid ? (
        <WeeklyScheduleView
          yearId={yearId}
          classId={classId}
          sectionId={sectionId}
        />
      ) : (
        <p className="rounded-2xl border border-border bg-white px-6 py-10 text-center text-sm text-muted">
          Missing schedule information. Go back and open a schedule from the list.
        </p>
      )}
    </div>
  );
}
