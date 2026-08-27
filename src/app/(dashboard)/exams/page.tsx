import { PageHeader } from "@/components/dashboard/PageHeader";
import { fakeSchoolExams } from "@/features/school/mocks/adminDashboard";

export default function ExamsPage() {
  return (
    <div>
      <PageHeader
        title="Exam schedules"
        description="Exam dates published for classes"
      />
      <div className="space-y-4">
        {fakeSchoolExams.map((exam) => (
          <article key={exam.id} className="rounded-2xl border border-border bg-white p-6">
            <p className="text-sm font-medium text-primary">
              {exam.className} · {exam.date}
            </p>
            <h2 className="mt-1 text-lg font-semibold">{exam.title}</h2>
            <p className="mt-2 text-sm">
              {exam.courseTitle} at {exam.startTime} ({exam.duration} min)
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}
