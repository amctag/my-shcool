"use client";

import Link from "next/link";
import { ClipboardList, GraduationCap, Presentation, Users } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import { LoadingDots } from "@/components/dashboard/TableLoading";
import { getApiErrorMessage } from "@/lib/getApiErrorMessage";
import { useGetDashboardOverviewQuery } from "@/features/school/api/overviewApi";
import { useSchoolYearFilter } from "@/features/school/useSchoolYearFilter";
import { selectAccessToken, selectAuthReady, selectSchoolName } from "@/features/auth/authSlice";
import { useAppSelector } from "@/store/hooks";

export function OverviewDashboard() {
  const ready = useAppSelector(selectAuthReady);
  const accessToken = useAppSelector(selectAccessToken);
  const schoolNameFromAuth = useAppSelector(selectSchoolName);
  const canFetch = ready && Boolean(accessToken);
  const { yearId, years } = useSchoolYearFilter(canFetch);
  const selectedYear = years.find((year) => year.id === yearId);

  const { data, error, isLoading, isFetching } = useGetDashboardOverviewQuery(
    { yearId: yearId ?? undefined },
    { skip: !canFetch || !yearId },
  );

  const schoolName = data?.schoolName || schoolNameFromAuth || "School";
  const yearTitle =
    data?.yearTitle ||
    (selectedYear
      ? selectedYear.isCurrent
        ? `${selectedYear.title} (current)`
        : selectedYear.title
      : null);

  if (!canFetch || !yearId || isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Dashboard" description="Loading overview…" />
        <p className="rounded-2xl border border-border bg-white px-6 py-10 text-center text-sm text-muted">
          <span className="inline-flex items-center gap-2">
            Loading overview
            <LoadingDots label="Loading overview" />
          </span>
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title={`${schoolName} dashboard`} description="Overview" />
        <p
          className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700"
          role="alert"
        >
          {getApiErrorMessage(error, "Could not load overview")}
        </p>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className={`space-y-6 ${isFetching ? "opacity-80" : ""}`}>
      <PageHeader
        title={`${schoolName} dashboard`}
        description={
          yearTitle
            ? `School admin · ${yearTitle}`
            : "School admin overview"
        }
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Students"
          value={data.stats.students}
          icon={Users}
        />
        <StatCard
          label="Teachers"
          value={data.stats.teachers}
          icon={Presentation}
        />
        <StatCard
          label="Classes"
          value={data.stats.classes}
          icon={GraduationCap}
        />
        <StatCard
          label="Absences today"
          value={data.stats.absencesToday}
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
          {data.recentStudents.length === 0 ? (
            <p className="mt-4 text-sm text-muted">
              No students registered for this year yet.
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-border">
              {data.recentStudents.map((student) => (
                <li
                  key={student.studentId}
                  className="flex items-center justify-between py-3"
                >
                  <div>
                    <Link
                      href={`/students/${student.studentId}`}
                      className="font-medium text-primary underline-offset-2 hover:underline"
                    >
                      {student.name}
                    </Link>
                    <p className="text-sm text-muted">
                      {[student.className, student.sectionName]
                        .filter(Boolean)
                        .join(" · ") || "No class"}
                      {student.parentName
                        ? ` · Parent: ${student.parentName}`
                        : ""}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
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
          {data.todayAgendas.length === 0 ? (
            <p className="mt-4 text-sm text-muted">No agenda items for today.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {data.todayAgendas.map((item) => (
                <li key={item.id} className="rounded-xl bg-primary-soft p-4">
                  <p className="text-sm font-medium text-primary">
                    {item.sectionsLabel} · {item.courseTitle}
                  </p>
                  <p className="mt-1 font-medium">{item.title}</p>
                  <p className="mt-1 text-sm text-muted">
                    {item.description}
                  </p>
                  <p className="mt-1 text-sm text-muted">{item.time}</p>
                </li>
              ))}
            </ul>
          )}
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
        {data.recentAnnouncements.length === 0 ? (
          <p className="mt-4 text-sm text-muted">No announcements yet.</p>
        ) : (
          <ul className="mt-4 space-y-4">
            {data.recentAnnouncements.map((item) => (
              <li
                key={item.id}
                className="border-b border-border pb-4 last:border-0 last:pb-0"
              >
                <p className="font-medium">{item.title || "Announcement"}</p>
                <p className="mt-1 text-sm text-muted">
                  {item.audienceLabel} · {item.content}
                </p>
              </li>
            ))}
          </ul>
        )}
      </article>
    </div>
  );
}
