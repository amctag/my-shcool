import Link from "next/link";
import { GradeFormDetailsPanel } from "@/features/school/components/GradeFormDetailsPanel";

export default async function GradeFormDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const gradeFormId = Number(id);

  return (
    <div className="space-y-4">
      <Link
        href="/grade-forms"
        className="inline-flex min-h-11 items-center text-sm font-medium text-primary hover:text-primary-hover"
      >
        Back to grade forms
      </Link>
      {Number.isInteger(gradeFormId) && gradeFormId > 0 ? (
        <GradeFormDetailsPanel gradeFormId={gradeFormId} />
      ) : (
        <p className="text-sm text-red-600">Invalid grade form id.</p>
      )}
    </div>
  );
}
