import { BackLink } from "@/components/dashboard/BackLink";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { RegistrationForm } from "@/features/school/components/RegistrationForm";

export default async function EditRegistrationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const registrationId = Number(id);

  return (
    <div className="space-y-4">
      <BackLink href="/registrations">Back to registrations</BackLink>
      <PageHeader
        title="Edit registration"
        description="Update class or section for this enrollment"
      />
      {Number.isInteger(registrationId) && registrationId > 0 ? (
        <RegistrationForm registrationId={registrationId} />
      ) : (
        <p className="text-sm text-red-600">Invalid registration id.</p>
      )}
    </div>
  );
}
