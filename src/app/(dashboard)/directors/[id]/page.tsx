import { BackLink } from "@/components/dashboard/BackLink";
import { DirectorProfile } from "@/features/school/components/DirectorProfile";

export default async function ViewDirectorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const directorId = Number(id);

  return (
    <div className="space-y-4">
      <BackLink href="/directors">Back to directors</BackLink>
      {Number.isInteger(directorId) && directorId > 0 ? (
        <DirectorProfile directorId={directorId} />
      ) : (
        <p className="text-sm text-red-600">Invalid director id.</p>
      )}
    </div>
  );
}
