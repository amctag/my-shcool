import { BackLink } from "@/components/dashboard/BackLink";
import { ItemForm } from "@/features/school/components/ItemForm";
export default function AddItemPage() {
  return (
    <div className="space-y-4">
      <BackLink href="/accounting/items">Back to items</BackLink>
      <ItemForm />
    </div>
  );
}
