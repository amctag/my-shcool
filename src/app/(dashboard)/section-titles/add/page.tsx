import { BackLink } from "@/components/dashboard/BackLink";
import { SectionTitleForm } from "@/features/school/components/SectionTitleForm";

export default function AddSectionTitlePage() {
  return (
    <div className="space-y-4">
      <BackLink
        href="/section-titles"
      >
        Back to section titles
      </BackLink>
      <SectionTitleForm />
    </div>
  );
}
