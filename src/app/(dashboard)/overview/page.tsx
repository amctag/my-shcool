import Link from "next/link";
import { ClipboardList, GraduationCap, Presentation, Users } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import {
  fakeAdmin,
  fakeSchoolAbsences,
  fakeSchoolAgendas,
  fakeSchoolAnnouncements,
  fakeSchoolStats,
  fakeStudents,
} from "@/features/school/mocks/adminDashboard";

export default function OverviewPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title={`${fakeAdmin.schoolName} dashboard`}
        description={`School admin only · ${fakeAdmin.yearTitle}. Parents, students, and teachers cannot open this console.`}
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Students" value={fakeSchoolStats.students} icon={Users} />
        <StatCard label="Teachers" value={fakeSchoolStats.teachers} icon={Presentation} />
        <StatCard label="Classes" value={fakeSchoolStats.classes} icon={GraduationCap} />
        <StatCard
          label="Absences today"
          value={fakeSchoolStats.absences}
          icon={ClipboardList}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <article className="rounded-2xl border border-border bg-white p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Students</h2>
            <Link
              href="/students"
              className="cursor-pointer text-sm font-medium text-primary hover:text-primary-hover"
            >
              Manage students
            </Link>
          </div>
          <ul className="mt-4 divide-y divide-border">
            {fakeStudents.map((student) => (
              <li key={student.studentId} className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium">{student.name}</p>
                  <p className="text-sm text-muted">
                    {student.className} · Parent: {student.parentName}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </article>

        <article className="rounded-2xl border border-border bg-white p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Today’s agenda</h2>
            <Link
              href="/agenda"
              className="cursor-pointer text-sm font-medium text-primary hover:text-primary-hover"
            >
              Open agenda
            </Link>
          </div>
          <ul className="mt-4 space-y-3">
            {fakeSchoolAgendas.map((item) => (
              <li key={item.id} className="rounded-xl bg-primary-soft p-4">
                <p className="text-sm font-medium text-primary">
                  {item.className} · {item.courseTitle}
                </p>
                <p className="mt-1 font-medium">{item.description}</p>
                <p className="mt-1 text-sm text-muted">
                  {item.teacherName} · {item.time}
                </p>
              </li>
            ))}
          </ul>
        </article>
      </section>

      <article className="rounded-2xl border border-border bg-white p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">School announcements</h2>
          <Link
            href="/announcements"
            className="cursor-pointer text-sm font-medium text-primary hover:text-primary-hover"
          >
            Manage
          </Link>
        </div>
        <ul className="mt-4 space-y-4">
          {fakeSchoolAnnouncements.map((item) => (
            <li key={item.id} className="border-b border-border pb-4 last:border-0 last:pb-0">
              <p className="font-medium">{item.title}</p>
              <p className="mt-1 text-sm text-muted">
                {item.audience} · {item.content}
              </p>
            </li>
          ))}
        </ul>
        {fakeSchoolAbsences.length > 0 ? (
          <p className="mt-4 text-sm text-muted">
            {fakeSchoolAbsences.length} absence record
            {fakeSchoolAbsences.length === 1 ? "" : "s"} this month.
          </p>
        ) : null}
      </article>
    </div>
  );
}
