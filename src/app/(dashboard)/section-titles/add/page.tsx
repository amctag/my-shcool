import Link from "next/link";
import { SectionTitleForm } from "@/features/school/components/SectionTitleForm";

export default function AddSectionTitlePage() {
  return (
    <div className="space-y-4">
      <Link
        href="/section-titles"
        className="inline-flex min-h-11 items-center text-sm font-medium text-primary hover:text-primary-hover"
      >
        Back to section titles
      </Link>
      <SectionTitleForm />
    </div>
  );
}
