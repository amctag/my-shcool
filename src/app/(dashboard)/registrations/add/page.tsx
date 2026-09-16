import { BackLink } from "@/components/dashboard/BackLink";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { RegistrationForm } from "@/features/school/components/RegistrationForm";

export default function AddRegistrationPage() {
  return (
    <div className="space-y-4">
      <BackLink
        href="/registrations"
      >
        Back to registrations
      </BackLink>
      <PageHeader
        title="Add registration"
        description="Register a student into a class section"
      />
      <RegistrationForm />
    </div>
  );
}
