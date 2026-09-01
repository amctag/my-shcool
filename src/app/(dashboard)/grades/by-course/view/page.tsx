import Link from "next/link";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { GradeByCourseView } from "@/features/school/components/GradeByCourseView";

type ViewGradeByCoursePageProps = {
  searchParams: Promise<{
    gradeId?: string;
    saved?: string;
  }>;
};

export default async function ViewGradeByCoursePage({
  searchParams,
}: ViewGradeByCoursePageProps) {
  const params = await searchParams;
  const gradeId = Number(params.gradeId);
  const valid = gradeId > 0;
  const saved = params.saved === "1";

  return (
    <div className="space-y-4">
      <Link
        href="/grades/by-course"
        className="inline-flex min-h-11 items-center text-sm font-medium text-primary hover:text-primary-hover"
      >
        Back to grades by course
      </Link>
      <PageHeader
        title="Grade sheet details"
        description="View student grades for this course and grade type"
      />
      {valid ? (
        <>
          {saved ? (
            <p
              className="rounded-2xl border border-green-200 bg-green-50 px-5 py-4 text-sm text-green-800"
              role="status"
            >
              Grades saved successfully.
            </p>
          ) : null}
          <GradeByCourseView gradeId={gradeId} showEditLink />
        </>
      ) : (
        <p className="rounded-2xl border border-border bg-white px-6 py-10 text-center text-sm text-muted">
          Missing grade information. Go back and open a grade sheet from the
          list.
        </p>
      )}
    </div>
  );
}
