import { PageHeader } from "@/components/dashboard/PageHeader";
import { fakeSchoolAnnouncements } from "@/features/school/mocks/adminDashboard";

export default function AnnouncementsPage() {
  return (
    <div>
      <PageHeader
        title="Announcements"
        description="School-wide and class announcements"
      />
      <div className="space-y-4">
        {fakeSchoolAnnouncements.map((item) => (
          <article key={item.id} className="rounded-2xl border border-border bg-white p-6">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold">{item.title}</h2>
              <span className="rounded-full bg-primary-soft px-2 py-1 text-xs font-medium text-primary">
                {item.audience}
              </span>
            </div>
            <p className="mt-3">{item.content}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
