import { BackLink } from "@/components/dashboard/BackLink";
import { AgendaSectionForm } from "@/features/school/components/AgendaSectionForm";

export default async function ViewAgendaSectionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const assignmentId = Number(id);

  return (
    <div className="space-y-4">
      <BackLink
        href="/agenda/sections"
      >
        Back to agenda sections
      </BackLink>
      {Number.isInteger(assignmentId) && assignmentId > 0 ? (
        <AgendaSectionForm assignmentId={assignmentId} readOnly />
      ) : (
        <p className="text-sm text-red-600">Invalid agenda section id.</p>
      )}
    </div>
  );
}
