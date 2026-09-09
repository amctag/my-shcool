import Link from "next/link";
import { NoticeForm } from "@/features/school/components/NoticeForm";

export default function AddNoticePage() {
  return (
    <div className="space-y-4">
      <Link
        href="/notices"
        className="inline-flex min-h-11 items-center text-sm font-medium text-primary hover:text-primary-hover"
      >
        Back to notices
      </Link>
      <NoticeForm />
    </div>
  );
}
