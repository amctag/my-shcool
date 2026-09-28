import { PageHeader } from "@/components/dashboard/PageHeader";
import { RegistrationPackagesTable } from "@/features/school/components/RegistrationPackagesTable";
export default function RegistrationPackagesPage() {
  return (
    <div>
      <PageHeader
        title="Registration Packages"
        description="Manage school-year fees, items, and eligible classes"
      />
      <RegistrationPackagesTable />
    </div>
  );
}
