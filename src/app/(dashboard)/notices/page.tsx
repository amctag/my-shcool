import { PageHeader } from "@/components/dashboard/PageHeader";
import { NoticesList } from "@/features/school/components/NoticesList";

export default function NoticesPage() {
  return (
    <div>
      <PageHeader
        title="Notices"
        description="Notices sent to the school, a section, or specific students"
      />
      <NoticesList />
    </div>
  );
}
