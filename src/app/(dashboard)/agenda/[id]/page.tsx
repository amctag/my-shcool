import Link from "next/link";
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
      <Link
        href="/agenda"
        className="inline-flex min-h-11 items-center text-sm font-medium text-primary hover:text-primary-hover"
      >
        Back to agenda
      </Link>
      {Number.isInteger(agendaId) && agendaId > 0 ? (
        <AgendaForm agendaId={agendaId} readOnly />
      ) : (
        <p className="text-sm text-red-600">Invalid agenda id.</p>
      )}
    </div>
  );
}
