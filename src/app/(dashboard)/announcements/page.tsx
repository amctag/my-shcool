import { PageHeader } from "@/components/dashboard/PageHeader";
import { AnnouncementsList } from "@/features/school/components/AnnouncementsList";

export default function AnnouncementsPage() {
  return (
    <div>
      <PageHeader
        title="Announcements"
        description="School-wide and class announcements"
      />
      <AnnouncementsList />
    </div>
  );
}
