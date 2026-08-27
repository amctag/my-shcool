import { PageHeader } from "@/components/dashboard/PageHeader";
import { fakeClasses } from "@/features/school/mocks/adminDashboard";

export default function ClassesPage() {
  return (
    <div>
      <PageHeader
        title="Classes"
        description="Sections in the current school year"
      />
      <div className="grid gap-4 md:grid-cols-2">
        {fakeClasses.map((item) => (
          <article key={item.id} className="rounded-2xl border border-border bg-white p-6">
            <p className="text-sm font-medium text-primary">{item.sectionName}</p>
            <h2 className="mt-1 text-xl font-semibold">{item.className}</h2>
            <p className="mt-3 text-sm text-muted">{item.students} students</p>
            <p className="mt-1 text-sm text-muted">Teacher: {item.teacherName}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
