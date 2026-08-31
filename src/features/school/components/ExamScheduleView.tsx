"use client";

import { CalendarDays } from "lucide-react";
import { LoadingDots } from "@/components/dashboard/TableLoading";
import { getApiErrorMessage } from "@/lib/getApiErrorMessage";
import { useGetDashboardExamScheduleQuery } from "@/features/school/api/examSchedulesApi";
import { selectAuthReady, selectAccessToken } from "@/features/auth/authSlice";
import { useAppSelector } from "@/store/hooks";

type ExamScheduleViewProps = {
  scheduleId: number;
};

function formatDisplayDate(value: string): string {
  return new Intl.DateTimeFormat("en", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}

export function ExamScheduleView({ scheduleId }: ExamScheduleViewProps) {
  const ready = useAppSelector(selectAuthReady);
  const accessToken = useAppSelector(selectAccessToken);
  const canFetch = ready && Boolean(accessToken);

  const { data, error, isLoading } = useGetDashboardExamScheduleQuery(
    scheduleId,
    { skip: !canFetch },
  );

  if (isLoading) {
    return (
      <p className="rounded-2xl border border-border bg-white px-6 py-10 text-center text-sm text-muted">
        <span className="inline-flex items-center gap-2">
          Loading exam schedule
          <LoadingDots label="Loading exam schedule" />
        </span>
      </p>
    );
  }

  if (error) {
    return (
      <p
        className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700"
        role="alert"
      >
        {getApiErrorMessage(error, "Could not load exam schedule")}
      </p>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <article className="overflow-hidden rounded-2xl bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
      <div className="border-b border-stone-100 px-5 py-4">
        <h2 className="text-lg font-semibold text-foreground">{data.title}</h2>
        <p className="mt-1 text-sm text-muted">
          {data.yearTitle} · {data.className} · {data.gradeTypeTitle}
        </p>
        {data.note ? (
          <p className="mt-3 text-sm text-foreground">{data.note}</p>
        ) : null}
      </div>

      <div className="space-y-4 p-5">
        {data.dates.map((examDate) => (
          <section
            key={examDate.id}
            className="overflow-hidden rounded-2xl border border-stone-200"
          >
            <div className="flex items-center gap-2 border-b border-stone-100 bg-primary px-4 py-3 text-on-primary">
              <CalendarDays className="h-4 w-4" aria-hidden />
              <h3 className="text-sm font-semibold">
                {formatDisplayDate(examDate.date)}
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-stone-100 bg-stone-50/80">
                  <tr>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted">
                      Course
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted">
                      Start
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted">
                      Duration
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted">
                      Note
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {examDate.exams.map((exam) => (
                    <tr
                      key={exam.id}
                      className="border-b border-stone-100 last:border-b-0"
                    >
                      <td className="px-4 py-3 font-medium text-foreground">
                        {exam.courseTitle}
                      </td>
                      <td className="px-4 py-3 text-foreground">
                        {exam.startTime}
                      </td>
                      <td className="px-4 py-3 text-foreground">
                        {exam.duration} min
                      </td>
                      <td className="px-4 py-3 text-foreground">
                        {exam.note ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ))}
      </div>
    </article>
  );
}
