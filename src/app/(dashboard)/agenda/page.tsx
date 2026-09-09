import { Suspense } from "react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { AgendasTable } from "@/features/school/components/AgendasTable";

export default function AgendaPage() {
  return (
    <div>
      <PageHeader
        title="Agenda"
        description="Homework and class work assigned to sections"
      />
      <Suspense
        fallback={
          <p className="rounded-2xl border border-border bg-white px-6 py-10 text-center text-sm text-muted">
            Loading agendas…
          </p>
        }
      >
        <AgendasTable />
      </Suspense>
    </div>
  );
}
