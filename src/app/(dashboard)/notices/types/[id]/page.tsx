import { BackLink } from "@/components/dashboard/BackLink";
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
      <BackLink
        href="/notices/types"
      >
        Back to notice types
      </BackLink>
      {Number.isInteger(typeId) && typeId > 0 ? (
        <NoticeTypeForm typeId={typeId} readOnly />
      ) : (
        <p className="text-sm text-red-600">Invalid notice type id.</p>
      )}
    </div>
  );
}
