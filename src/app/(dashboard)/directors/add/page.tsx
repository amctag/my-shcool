import { BackLink } from "@/components/dashboard/BackLink";
import { DirectorForm } from "@/features/school/components/DirectorForm";

export default function AddDirectorPage() {
  return (
    <div className="space-y-4">
      <BackLink href="/directors">Back to directors</BackLink>
      <DirectorForm />
    </div>
  );
}
