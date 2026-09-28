import { BackLink } from "@/components/dashboard/BackLink";
import { RecordDetail } from "@/features/school/components/RecordDetail";

export default async function RecordDetailPage({
  params,
}: PageProps<"/accounting/records/[id]">) {
  const { id } = await params;
  return (
    <div className="space-y-4">
      <BackLink href="/accounting/records">Back to records</BackLink>
      <RecordDetail id={Number(id)} />
    </div>
  );
}
