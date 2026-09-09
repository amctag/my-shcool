import Link from "next/link";
import { ActivityForm } from "@/features/school/components/ActivityForm";

export default function AddActivityPage() {
  return (
    <div className="space-y-4">
      <Link
        href="/activities"
        className="inline-flex min-h-11 items-center text-sm font-medium text-primary hover:text-primary-hover"
      >
        Back to activities
      </Link>
      <ActivityForm />
    </div>
  );
}
