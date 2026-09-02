import Link from "next/link";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { GradeFormForm } from "@/features/school/components/GradeFormForm";

export default async function EditGradeFormPage({
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
      <PageHeader
        title="Edit grade form"
        description="Update report card layout settings"
      />
      {Number.isInteger(gradeFormId) && gradeFormId > 0 ? (
        <GradeFormForm gradeFormId={gradeFormId} />
      ) : (
        <p className="text-sm text-red-600">Invalid grade form id.</p>
      )}
    </div>
  );
}
