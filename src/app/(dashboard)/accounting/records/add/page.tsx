import { BackLink } from "@/components/dashboard/BackLink";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { RecordForm } from "@/features/school/components/RecordForm";

export default function AddRecordPage() {
  return (
    <div className="space-y-4">
      <BackLink href="/accounting/records">Back to records</BackLink>
      <PageHeader
        title="New record"
        description="Post a manual balanced journal entry"
      />
      <RecordForm />
    </div>
  );
}
