import { BackLink } from "@/components/dashboard/BackLink";
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
      <BackLink
        href="/grade-forms"
      >
        Back to grade forms
      </BackLink>
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
