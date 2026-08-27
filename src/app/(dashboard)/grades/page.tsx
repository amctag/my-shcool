import { PageHeader } from "@/components/dashboard/PageHeader";
import { fakeSchoolGrades } from "@/features/school/mocks/adminDashboard";

export default function GradesPage() {
  return (
    <div>
      <PageHeader
        title="Grades"
        description="Published scores across classes"
      />
      <article className="overflow-hidden rounded-2xl border border-border bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-primary-soft text-muted">
            <tr>
              <th className="px-6 py-3 font-medium">Student</th>
              <th className="px-6 py-3 font-medium">Class</th>
              <th className="px-6 py-3 font-medium">Course</th>
              <th className="px-6 py-3 font-medium">Type</th>
              <th className="px-6 py-3 font-medium">Score</th>
            </tr>
          </thead>
          <tbody>
            {fakeSchoolGrades.map((grade) => (
              <tr key={grade.id} className="border-t border-border">
                <td className="px-6 py-3 font-medium">{grade.studentName}</td>
                <td className="px-6 py-3">{grade.className}</td>
                <td className="px-6 py-3">{grade.courseTitle}</td>
                <td className="px-6 py-3">{grade.gradeTypeTitle}</td>
                <td className="px-6 py-3">
                  {grade.score} / {grade.maxGrade}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </article>
    </div>
  );
}
