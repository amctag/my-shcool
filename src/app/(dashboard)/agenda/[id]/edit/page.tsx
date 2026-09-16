import { BackLink } from "@/components/dashboard/BackLink";
import { AgendaForm } from "@/features/school/components/AgendaForm";

export default async function EditAgendaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const agendaId = Number(id);
  const backHref =
    Number.isInteger(agendaId) && agendaId > 0
      ? `/agenda/${agendaId}`
      : "/agenda";

  return (
    <div className="space-y-4">
      <BackLink href={backHref}>Back to agenda</BackLink>
      {Number.isInteger(agendaId) && agendaId > 0 ? (
        <AgendaForm agendaId={agendaId} />
      ) : (
        <p className="text-sm text-red-600">Invalid agenda id.</p>
      )}
    </div>
  );
}
