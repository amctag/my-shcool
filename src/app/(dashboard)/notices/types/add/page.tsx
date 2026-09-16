import { BackLink } from "@/components/dashboard/BackLink";
import { NoticeTypeForm } from "@/features/school/components/NoticeTypeForm";

export default function AddNoticeTypePage() {
  return (
    <div className="space-y-4">
      <BackLink
        href="/notices/types"
      >
        Back to notice types
      </BackLink>
      <NoticeTypeForm />
    </div>
  );
}
