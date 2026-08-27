import { PageHeader } from "@/components/dashboard/PageHeader";
import { fakeSchoolAgendas } from "@/features/school/mocks/adminDashboard";

export default function AgendaPage() {
  return (
    <div>
      <PageHeader
        title="Agenda"
        description="Homework assigned to classes"
      />
      <div className="space-y-4">
        {fakeSchoolAgendas.map((item) => (
          <article key={item.id} className="rounded-2xl border border-border bg-white p-6">
            <p className="text-sm font-medium text-primary">
              {item.className} · {item.courseTitle} · {item.time}
            </p>
            <h2 className="mt-1 text-lg font-semibold">{item.description}</h2>
            <p className="mt-2 text-sm text-muted">{item.teacherName}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
