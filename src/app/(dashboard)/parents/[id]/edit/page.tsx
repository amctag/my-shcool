import Link from "next/link";
import { ParentForm } from "@/features/school/components/ParentForm";

export default async function EditParentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const parentId = Number(id);

  return (
    <div className="space-y-4">
      <Link
        href="/parents"
        className="inline-flex min-h-11 items-center text-sm font-medium text-primary hover:text-primary-hover"
      >
        Back to parents
      </Link>
      {Number.isInteger(parentId) && parentId > 0 ? (
        <ParentForm parentId={parentId} />
      ) : (
        <p className="text-sm text-red-600">Invalid parent id.</p>
      )}
    </div>
  );
}
