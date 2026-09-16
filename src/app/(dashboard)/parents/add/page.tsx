import { BackLink } from "@/components/dashboard/BackLink";
import { AddParentForm } from "@/features/school/components/AddParentForm";

export default function AddParentPage() {
  return (
    <div className="space-y-4">
      <BackLink
        href="/parents"
      >
        Back to parents
      </BackLink>
      <AddParentForm />
    </div>
  );
}
