import { BackLink } from "@/components/dashboard/BackLink";
import { TeachForm } from "@/features/school/components/TeachForm";

export default function AddTeachPage() {
  return (
    <div className="space-y-4">
      <BackLink
        href="/teaches"
      >
        Back to teach
      </BackLink>
      <TeachForm />
    </div>
  );
}
