import Link from "next/link";
import { AgendaSectionForm } from "@/features/school/components/AgendaSectionForm";

export default async function EditAgendaSectionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const assignmentId = Number(id);

  return (
    <div className="space-y-4">
      <Link
        href="/agenda/sections"
        className="inline-flex min-h-11 items-center text-sm font-medium text-primary hover:text-primary-hover"
      >
        Back to agenda sections
      </Link>
      {Number.isInteger(assignmentId) && assignmentId > 0 ? (
        <AgendaSectionForm assignmentId={assignmentId} />
      ) : (
        <p className="text-sm text-red-600">Invalid agenda section id.</p>
      )}
    </div>
  );
}
