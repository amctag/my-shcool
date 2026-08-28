import Link from "next/link";
import { SectionForm } from "@/features/school/components/SectionForm";

export default function AddSectionPage() {
  return (
    <div className="space-y-4">
      <Link
        href="/sections"
        className="inline-flex min-h-11 items-center text-sm font-medium text-primary hover:text-primary-hover"
      >
        Back to sections
      </Link>
      <SectionForm />
    </div>
  );
}
