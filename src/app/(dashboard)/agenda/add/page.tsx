import { BackLink } from "@/components/dashboard/BackLink";
import { AgendaForm } from "@/features/school/components/AgendaForm";

export default function AddAgendaPage() {
  return (
    <div className="space-y-4">
      <BackLink
        href="/agenda"
      >
        Back to agenda
      </BackLink>
      <AgendaForm />
    </div>
  );
}
