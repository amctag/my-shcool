import { PageHeader } from "@/components/dashboard/PageHeader";
import { fakeSchoolSchedule } from "@/features/school/mocks/adminDashboard";

export default function SchedulePage() {
  return (
    <div>
      <PageHeader
        title="Weekly schedule"
        description="Class sessions for this school"
      />
      <article className="overflow-hidden rounded-2xl border border-border bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-primary-soft text-muted">
            <tr>
              <th className="px-6 py-3 font-medium">Day</th>
              <th className="px-6 py-3 font-medium">Class</th>
              <th className="px-6 py-3 font-medium">Session</th>
              <th className="px-6 py-3 font-medium">Course</th>
              <th className="px-6 py-3 font-medium">Teacher</th>
            </tr>
          </thead>
          <tbody>
            {fakeSchoolSchedule.map((row, index) => (
              <tr key={`${row.dayName}-${row.className}-${index}`} className="border-t border-border">
                <td className="px-6 py-3">{row.dayName}</td>
                <td className="px-6 py-3">{row.className}</td>
                <td className="px-6 py-3">{row.sessionName}</td>
                <td className="px-6 py-3 font-medium">{row.courseTitle}</td>
                <td className="px-6 py-3">{row.teacherName}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </article>
    </div>
  );
}
