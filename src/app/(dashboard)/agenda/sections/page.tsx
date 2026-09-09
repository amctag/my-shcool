import { PageHeader } from "@/components/dashboard/PageHeader";
import { AgendaSectionsTable } from "@/features/school/components/AgendaSectionsTable";

export default function AgendaSectionsPage() {
  return (
    <div>
      <PageHeader
        title="Agenda sections"
        description="Assign agendas to class sections"
      />
      <AgendaSectionsTable />
    </div>
  );
}
