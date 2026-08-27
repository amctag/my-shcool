import Link from "next/link";
import { AddParentForm } from "@/features/school/components/AddParentForm";

export default function AddParentPage() {
  return (
    <div className="space-y-4">
      <Link
        href="/parents"
        className="inline-flex min-h-11 items-center text-sm font-medium text-primary hover:text-primary-hover"
      >
        Back to parents
      </Link>
      <AddParentForm />
    </div>
  );
}
