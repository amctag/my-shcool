import { BackLink } from "@/components/dashboard/BackLink";
import { TeachForm } from "@/features/school/components/TeachForm";

export default async function ViewTeachPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const teachId = Number(id);

  return (
    <div className="space-y-4">
      <BackLink
        href="/teaches"
      >
        Back to teach
      </BackLink>
      {Number.isInteger(teachId) && teachId > 0 ? (
        <TeachForm teachId={teachId} readOnly />
      ) : (
        <p className="text-sm text-red-600">Invalid teach id.</p>
      )}
    </div>
  );
}
