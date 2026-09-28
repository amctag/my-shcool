import { PageHeader } from "@/components/dashboard/PageHeader";
import { RecordsList } from "@/features/school/components/RecordsList";

export default function RecordsPage() {
  return (
    <div>
      <PageHeader
        title="Records"
        description="Manual balanced journal entries"
      />
      <RecordsList />
    </div>
  );
}
