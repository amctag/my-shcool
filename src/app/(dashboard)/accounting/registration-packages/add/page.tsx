import { BackLink } from "@/components/dashboard/BackLink";
import { RegistrationPackageForm } from "@/features/school/components/RegistrationPackageForm";
export default function AddRegistrationPackagePage() {
  return (
    <div className="space-y-4">
      <BackLink href="/accounting/registration-packages">
        Back to packages
      </BackLink>
      <RegistrationPackageForm />
    </div>
  );
}
