import { BackLink } from "@/components/dashboard/BackLink";
import { AgendaForm } from "@/features/school/components/AgendaForm";

export default async function ViewAgendaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const agendaId = Number(id);

  return (
    <div className="space-y-4">
      <BackLink
        href="/agenda"
      >
        Back to agenda
      </BackLink>
      {Number.isInteger(agendaId) && agendaId > 0 ? (
        <AgendaForm agendaId={agendaId} readOnly />
      ) : (
        <p className="text-sm text-red-600">Invalid agenda id.</p>
      )}
    </div>
  );
}
