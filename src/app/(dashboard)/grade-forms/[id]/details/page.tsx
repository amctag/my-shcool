import { BackLink } from "@/components/dashboard/BackLink";
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
      <BackLink
        href="/grade-forms"
      >
        Back to grade forms
      </BackLink>
      {Number.isInteger(gradeFormId) && gradeFormId > 0 ? (
        <GradeFormDetailsPanel gradeFormId={gradeFormId} />
      ) : (
        <p className="text-sm text-red-600">Invalid grade form id.</p>
      )}
    </div>
  );
}
