import { BackLink } from "@/components/dashboard/BackLink";
import { SectionForm } from "@/features/school/components/SectionForm";

export default function AddSectionPage() {
  return (
    <div className="space-y-4">
      <BackLink
        href="/sections"
      >
        Back to sections
      </BackLink>
      <SectionForm />
    </div>
  );
}
