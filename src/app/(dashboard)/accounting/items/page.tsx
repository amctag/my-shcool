import { PageHeader } from "@/components/dashboard/PageHeader";
import { ItemsTable } from "@/features/school/components/ItemsTable";
export default function ItemsPage() {
  return (
    <div>
      <PageHeader
        title="Items"
        description="Manage products and services used by accounting"
      />
      <ItemsTable />
    </div>
  );
}
