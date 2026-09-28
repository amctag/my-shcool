import { BackLink } from "@/components/dashboard/BackLink";
import { RegistrationPackageForm } from "@/features/school/components/RegistrationPackageForm";
export default async function EditRegistrationPackagePage({
  params,
}: PageProps<"/accounting/registration-packages/[id]/edit">) {
  const { id } = await params;
  return (
    <div className="space-y-4">
      <BackLink href="/accounting/registration-packages">
        Back to packages
      </BackLink>
      <RegistrationPackageForm id={Number(id)} />
    </div>
  );
}
