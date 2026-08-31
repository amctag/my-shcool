import Link from "next/link";
import { AnnouncementForm } from "@/features/school/components/AnnouncementForm";

export default function AddAnnouncementPage() {
  return (
    <div className="space-y-4">
      <Link
        href="/announcements"
        className="inline-flex min-h-11 items-center text-sm font-medium text-primary hover:text-primary-hover"
      >
        Back to announcements
      </Link>
      <AnnouncementForm />
    </div>
  );
}
