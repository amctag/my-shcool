import { BackLink } from "@/components/dashboard/BackLink";
import { NoticeForm } from "@/features/school/components/NoticeForm";

export default function AddNoticePage() {
  return (
    <div className="space-y-4">
      <BackLink
        href="/notices"
      >
        Back to notices
      </BackLink>
      <NoticeForm />
    </div>
  );
}
