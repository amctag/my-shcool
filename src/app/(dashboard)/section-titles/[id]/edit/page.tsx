import { BackLink } from "@/components/dashboard/BackLink";
import { SectionTitleForm } from "@/features/school/components/SectionTitleForm";

export default async function EditSectionTitlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const titleId = Number(id);

  return (
    <div className="space-y-4">
      <BackLink
        href="/section-titles"
      >
        Back to section titles
      </BackLink>
      {Number.isInteger(titleId) && titleId > 0 ? (
        <SectionTitleForm titleId={titleId} />
      ) : (
        <p className="text-sm text-red-600">Invalid section title id.</p>
      )}
    </div>
  );
}
