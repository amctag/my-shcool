import { PageHeader } from "@/components/dashboard/PageHeader";
import { fakeTeachers } from "@/features/school/mocks/adminDashboard";

export default function TeachersPage() {
  return (
    <div>
      <PageHeader
        title="Teachers"
        description="Teachers assigned to this school"
      />
      <div className="grid gap-4 md:grid-cols-2">
        {fakeTeachers.map((teacher) => (
          <article
            key={teacher.teacherId}
            className="rounded-2xl border border-border bg-white p-6"
          >
            <h2 className="text-lg font-semibold">{teacher.name}</h2>
            <p className="mt-2 text-sm text-muted">
              Courses: {teacher.courses.join(", ")}
            </p>
            <p className="mt-1 text-sm text-muted">
              Classes: {teacher.classNames.join(", ")}
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}
