import { BackLink } from "@/components/dashboard/BackLink";
import { ActivityForm } from "@/features/school/components/ActivityForm";

export default function AddActivityPage() {
  return (
    <div className="space-y-4">
      <BackLink
        href="/activities"
      >
        Back to activities
      </BackLink>
      <ActivityForm />
    </div>
  );
}
