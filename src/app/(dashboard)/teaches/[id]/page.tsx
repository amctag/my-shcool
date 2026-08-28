import Link from "next/link";
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
      <Link
        href="/teaches"
        className="inline-flex min-h-11 items-center text-sm font-medium text-primary hover:text-primary-hover"
      >
        Back to teach
      </Link>
      {Number.isInteger(teachId) && teachId > 0 ? (
        <TeachForm teachId={teachId} readOnly />
      ) : (
        <p className="text-sm text-red-600">Invalid teach id.</p>
      )}
    </div>
  );
}
