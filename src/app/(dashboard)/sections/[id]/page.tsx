import Link from "next/link";
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
      <Link
        href="/sections"
        className="inline-flex min-h-11 items-center text-sm font-medium text-primary hover:text-primary-hover"
      >
        Back to sections
      </Link>
      {Number.isInteger(sectionId) && sectionId > 0 ? (
        <SectionForm sectionId={sectionId} readOnly />
      ) : (
        <p className="text-sm text-red-600">Invalid section id.</p>
      )}
    </div>
  );
}
