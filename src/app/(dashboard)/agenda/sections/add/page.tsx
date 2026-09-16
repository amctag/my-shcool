import { BackLink } from "@/components/dashboard/BackLink";
import { AgendaSectionForm } from "@/features/school/components/AgendaSectionForm";

export default function AddAgendaSectionPage() {
  return (
    <div className="space-y-4">
      <BackLink
        href="/agenda/sections"
      >
        Back to agenda sections
      </BackLink>
      <AgendaSectionForm />
    </div>
  );
}
