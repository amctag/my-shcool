import { BackLink } from "@/components/dashboard/BackLink";
import { ItemForm } from "@/features/school/components/ItemForm";
export default async function EditItemPage({
  params,
}: PageProps<"/accounting/items/[id]/edit">) {
  const { id } = await params;
  return (
    <div className="space-y-4">
      <BackLink href="/accounting/items">Back to items</BackLink>
      <ItemForm id={Number(id)} />
    </div>
  );
}
