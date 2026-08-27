import { PageHeader } from "@/components/dashboard/PageHeader";
import { fakeSchoolActivities } from "@/features/school/mocks/adminDashboard";

export default function ActivitiesPage() {
  return (
    <div>
      <PageHeader title="Activities" description="School events" />
      <div className="grid gap-4 md:grid-cols-2">
        {fakeSchoolActivities.map((item) => (
          <article key={item.id} className="rounded-2xl border border-border bg-white p-6">
            <p className="text-sm font-medium text-primary">{item.date}</p>
            <h2 className="mt-1 text-lg font-semibold">{item.title}</h2>
            <p className="mt-3">{item.content}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
