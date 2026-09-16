import { BackLink } from "@/components/dashboard/BackLink";
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
      <BackLink
        href="/parents"
      >
        Back to parents
      </BackLink>
      {Number.isInteger(parentId) && parentId > 0 ? (
        <ParentForm parentId={parentId} />
      ) : (
        <p className="text-sm text-red-600">Invalid parent id.</p>
      )}
    </div>
  );
}
