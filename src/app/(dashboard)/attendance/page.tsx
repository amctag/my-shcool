import { PageHeader } from "@/components/dashboard/PageHeader";
import { fakeSchoolAbsences } from "@/features/school/mocks/adminDashboard";

export default function AttendancePage() {
  return (
    <div>
      <PageHeader
        title="Attendance"
        description="Absence records for this school"
      />
      <article className="overflow-hidden rounded-2xl border border-border bg-white">
        <ul className="divide-y divide-border">
          {fakeSchoolAbsences.map((item) => (
            <li key={item.id} className="px-6 py-4">
              <p className="font-medium">{item.studentName}</p>
              <p className="mt-1 text-sm text-muted">
                {item.className} · {item.date} · {item.status} · {item.reason}
              </p>
            </li>
          ))}
        </ul>
      </article>
    </div>
  );
}
