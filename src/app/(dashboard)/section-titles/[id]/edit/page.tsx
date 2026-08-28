import Link from "next/link";
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
      <Link
        href="/section-titles"
        className="inline-flex min-h-11 items-center text-sm font-medium text-primary hover:text-primary-hover"
      >
        Back to section titles
      </Link>
      {Number.isInteger(titleId) && titleId > 0 ? (
        <SectionTitleForm titleId={titleId} />
      ) : (
        <p className="text-sm text-red-600">Invalid section title id.</p>
      )}
    </div>
  );
}
