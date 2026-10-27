import { BackLink } from "@/components/dashboard/BackLink";
import { DirectorForm } from "@/features/school/components/DirectorForm";

export default async function EditDirectorPage({
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
        <DirectorForm directorId={directorId} />
      ) : (
        <p className="text-sm text-red-600">Invalid director id.</p>
      )}
    </div>
  );
}
