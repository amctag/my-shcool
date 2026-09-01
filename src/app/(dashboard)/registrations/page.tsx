import { PageHeader } from "@/components/dashboard/PageHeader";
import { RegistrationsTable } from "@/features/school/components/RegistrationsTable";

export default function RegistrationsPage() {
  return (
    <div>
      <PageHeader
        title="Registrations"
        description="Register students into class sections"
      />
      <RegistrationsTable />
    </div>
  );
}
