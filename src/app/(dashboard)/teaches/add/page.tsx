import Link from "next/link";
import { TeachForm } from "@/features/school/components/TeachForm";

export default function AddTeachPage() {
  return (
    <div className="space-y-4">
      <Link
        href="/teaches"
        className="inline-flex min-h-11 items-center text-sm font-medium text-primary hover:text-primary-hover"
      >
        Back to teach
      </Link>
      <TeachForm />
    </div>
  );
}
