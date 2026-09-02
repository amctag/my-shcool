import { PageHeader } from "@/components/dashboard/PageHeader";
import { ExportGradeCardPanel } from "@/features/school/components/ExportGradeCardPanel";

export default function ExportGradeCardPage() {
  return (
    <div>
      <PageHeader
        title="Export grade card"
        description="Filter by year, class, and section to list students for grade card export"
      />
      <ExportGradeCardPanel />
    </div>
  );
}
