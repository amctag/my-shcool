import Link from "next/link";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { RegistrationForm } from "@/features/school/components/RegistrationForm";

export default function AddRegistrationPage() {
  return (
    <div className="space-y-4">
      <Link
        href="/registrations"
        className="inline-flex min-h-11 items-center text-sm font-medium text-primary hover:text-primary-hover"
      >
        Back to registrations
      </Link>
      <PageHeader
        title="Add registration"
        description="Register a student into a class section"
      />
      <RegistrationForm />
    </div>
  );
}
