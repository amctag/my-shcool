import { PageHeader } from "@/components/dashboard/PageHeader";
import { ActivitiesList } from "@/features/school/components/ActivitiesList";

export default function ActivitiesPage() {
  return (
    <div>
      <PageHeader title="Activities" description="School events" />
      <ActivitiesList />
    </div>
  );
}
