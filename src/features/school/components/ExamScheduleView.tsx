"use client";

import { useState } from "react";
import { CalendarDays, FileDown, LoaderCircle } from "lucide-react";
import { LoadingDots } from "@/components/dashboard/TableLoading";
import { getApiErrorMessage } from "@/lib/getApiErrorMessage";
import { exportExamScheduleGridToPdf } from "@/lib/exportTable";
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
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const { data, error, isLoading } = useGetDashboardExamScheduleQuery(
    scheduleId,
    { skip: !canFetch },
  );

  function exportPdf() {
    if (!data) {
      return;
    }
    setExporting(true);
    setExportError(null);
    try {
      exportExamScheduleGridToPdf(
        `exam-schedule-${data.title}`,
        data.title,
        `${data.yearTitle} · ${data.className} · ${data.gradeTypeTitle}`,
        data.dates.map((examDate) => ({
          dateLabel: formatDisplayDate(examDate.date),
          rows: examDate.exams.map((exam, index) => ({
            index: index + 1,
            course: exam.courseTitle,
            start: exam.startTime,
            duration: `${exam.duration} min`,
            note: exam.note ?? "",
          })),
        })),
      );
    } catch (caught) {
      setExportError(getApiErrorMessage(caught, "Could not export PDF"));
    } finally {
      setExporting(false);
    }
  }

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
      <div className="flex flex-col gap-3 border-b border-stone-100 px-5 py-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">{data.title}</h2>
          <p className="mt-1 text-sm text-muted">
            {data.yearTitle} · {data.className} · {data.gradeTypeTitle}
          </p>
          {data.note ? (
            <p className="mt-3 text-sm text-foreground">{data.note}</p>
          ) : null}
        </div>
        <div className="flex flex-col items-stretch gap-2 sm:items-end">
          <button
            type="button"
            disabled={exporting || data.dates.length === 0}
            onClick={exportPdf}
            className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-lg border border-border bg-white px-3 text-sm font-medium text-foreground transition-colors hover:bg-primary-soft hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
          >
            {exporting ? (
              <LoaderCircle aria-hidden className="h-4 w-4 animate-spin" />
            ) : (
              <FileDown aria-hidden className="h-4 w-4" />
            )}
            PDF
          </button>
          {exportError ? (
            <p className="text-xs text-red-600" role="alert">
              {exportError}
            </p>
          ) : null}
        </div>
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
              <table className="min-w-full border-collapse text-center text-sm">
                <thead>
                  <tr className="bg-primary text-on-primary">
                    <th className="w-16 border border-primary-hover/30 px-3 py-3.5 text-xs font-semibold uppercase tracking-wide">
                      #
                    </th>
                    <th className="min-w-[10rem] border border-primary-hover/30 px-3 py-3.5 text-xs font-semibold uppercase tracking-wide">
                      Course
                    </th>
                    <th className="min-w-[7rem] border border-primary-hover/30 px-3 py-3.5 text-xs font-semibold uppercase tracking-wide">
                      Start
                    </th>
                    <th className="min-w-[7rem] border border-primary-hover/30 px-3 py-3.5 text-xs font-semibold uppercase tracking-wide">
                      Duration
                    </th>
                    <th className="min-w-[10rem] border border-primary-hover/30 px-3 py-3.5 text-xs font-semibold uppercase tracking-wide">
                      Note
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {examDate.exams.map((exam, examIndex) => (
                    <tr
                      key={exam.id}
                      className={
                        examIndex % 2 === 0 ? "bg-white" : "bg-primary-soft/40"
                      }
                    >
                      <td className="border border-stone-200 px-3 py-3 font-semibold text-foreground">
                        {examIndex + 1}
                      </td>
                      <td className="border border-stone-200 px-3 py-3 font-medium text-foreground">
                        {exam.courseTitle}
                      </td>
                      <td className="border border-stone-200 px-3 py-3 text-foreground">
                        {exam.startTime}
                      </td>
                      <td className="border border-stone-200 px-3 py-3 text-foreground">
                        {exam.duration} min
                      </td>
                      <td className="border border-stone-200 px-3 py-3 text-foreground">
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
