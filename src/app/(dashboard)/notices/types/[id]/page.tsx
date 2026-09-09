import Link from "next/link";
import { NoticeTypeForm } from "@/features/school/components/NoticeTypeForm";

export default async function ViewNoticeTypePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const typeId = Number(id);

  return (
    <div className="space-y-4">
      <Link
        href="/notices/types"
        className="inline-flex min-h-11 items-center text-sm font-medium text-primary hover:text-primary-hover"
      >
        Back to notice types
      </Link>
      {Number.isInteger(typeId) && typeId > 0 ? (
        <NoticeTypeForm typeId={typeId} readOnly />
      ) : (
        <p className="text-sm text-red-600">Invalid notice type id.</p>
      )}
    </div>
  );
}
