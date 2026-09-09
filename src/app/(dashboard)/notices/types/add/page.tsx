import Link from "next/link";
import { NoticeTypeForm } from "@/features/school/components/NoticeTypeForm";

export default function AddNoticeTypePage() {
  return (
    <div className="space-y-4">
      <Link
        href="/notices/types"
        className="inline-flex min-h-11 items-center text-sm font-medium text-primary hover:text-primary-hover"
      >
        Back to notice types
      </Link>
      <NoticeTypeForm />
    </div>
  );
}
