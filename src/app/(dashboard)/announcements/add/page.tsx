import { BackLink } from "@/components/dashboard/BackLink";
import { AnnouncementForm } from "@/features/school/components/AnnouncementForm";

export default function AddAnnouncementPage() {
  return (
    <div className="space-y-4">
      <BackLink
        href="/announcements"
      >
        Back to announcements
      </BackLink>
      <AnnouncementForm />
    </div>
  );
}
