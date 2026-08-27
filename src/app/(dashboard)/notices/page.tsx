import { PageHeader } from "@/components/dashboard/PageHeader";
import { fakeSchoolNotices } from "@/features/school/mocks/adminDashboard";

export default function NoticesPage() {
  return (
    <div>
      <PageHeader
        title="Notices"
        description="Notices sent to students or sections"
      />
      <div className="space-y-4">
        {fakeSchoolNotices.map((item) => (
          <article key={item.id} className="rounded-2xl border border-border bg-white p-6">
            <p className="text-sm font-medium text-primary">
              {item.date} · {item.audience}
            </p>
            <h2 className="mt-1 text-lg font-semibold">{item.title}</h2>
            <p className="mt-2">{item.description}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
