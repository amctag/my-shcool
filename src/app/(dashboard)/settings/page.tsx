import { PageHeader } from "@/components/dashboard/PageHeader";
import { SchoolSettingsForm } from "@/features/school/components/SchoolSettingsForm";

export default function SettingsPage() {
  return (
    <div>
      <PageHeader
        title="Settings"
        description="Control what teachers can see in this school"
      />
      <SchoolSettingsForm />
    </div>
  );
}
