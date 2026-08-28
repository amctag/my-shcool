import { PageHeader } from "@/components/dashboard/PageHeader";
import { SectionTitlesTable } from "@/features/school/components/SectionTitlesTable";

export default function SectionTitlesPage() {
  return (
    <div>
      <PageHeader
        title="Section titles"
        description="Shared labels (A, B, C…) reused by every class"
      />
      <SectionTitlesTable />
    </div>
  );
}
