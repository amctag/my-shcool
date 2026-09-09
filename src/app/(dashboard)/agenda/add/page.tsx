import Link from "next/link";
import { AgendaForm } from "@/features/school/components/AgendaForm";

export default function AddAgendaPage() {
  return (
    <div className="space-y-4">
      <Link
        href="/agenda"
        className="inline-flex min-h-11 items-center text-sm font-medium text-primary hover:text-primary-hover"
      >
        Back to agenda
      </Link>
      <AgendaForm />
    </div>
  );
}
