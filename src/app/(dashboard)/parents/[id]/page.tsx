import { BackLink } from "@/components/dashboard/BackLink";
import { ParentProfile } from "@/features/school/components/ParentProfile";

export default async function ViewParentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const parentId = Number(id);

  return (
    <div className="space-y-4">
      <BackLink href="/parents">Back to parents</BackLink>
      {Number.isInteger(parentId) && parentId > 0 ? (
        <ParentProfile parentId={parentId} />
      ) : (
        <p className="text-sm text-red-600">Invalid parent id.</p>
      )}
    </div>
  );
}
