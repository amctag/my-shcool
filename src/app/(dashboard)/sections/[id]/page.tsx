import { BackLink } from "@/components/dashboard/BackLink";
import { SectionForm } from "@/features/school/components/SectionForm";

export default async function ViewSectionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const sectionId = Number(id);

  return (
    <div className="space-y-4">
      <BackLink
        href="/sections"
      >
        Back to sections
      </BackLink>
      {Number.isInteger(sectionId) && sectionId > 0 ? (
        <SectionForm sectionId={sectionId} readOnly />
      ) : (
        <p className="text-sm text-red-600">Invalid section id.</p>
      )}
    </div>
  );
}
