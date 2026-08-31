"use client";

import { useMemo } from "react";
import { CalendarDays } from "lucide-react";
import { LoadingDots } from "@/components/dashboard/TableLoading";
import { getApiErrorMessage } from "@/lib/getApiErrorMessage";
import { useGetDashboardWeeklyScheduleGridQuery } from "@/features/school/api/weeklySchedulesApi";
import { selectAuthReady, selectAccessToken } from "@/features/auth/authSlice";
import { useAppSelector } from "@/store/hooks";
import type { DashboardWeeklyScheduleGridCell } from "@/features/school/types";

type WeeklyScheduleViewProps = {
  yearId: number;
  classId: number;
  sectionId: number;
};

export function WeeklyScheduleView({
  yearId,
  classId,
  sectionId,
}: WeeklyScheduleViewProps) {
  const ready = useAppSelector(selectAuthReady);
  const accessToken = useAppSelector(selectAccessToken);
  const canFetch = ready && Boolean(accessToken);

  const { data, error, isLoading } = useGetDashboardWeeklyScheduleGridQuery(
    { sectionId, yearId, classId },
    { skip: !canFetch },
  );

  const cellMap = useMemo(() => {
    const map = new Map<string, DashboardWeeklyScheduleGridCell>();
    for (const cell of data?.cells ?? []) {
      map.set(`${cell.dayId}:${cell.sessionId}`, cell);
    }
    return map;
  }, [data?.cells]);

  if (isLoading) {
    return (
      <p className="rounded-2xl border border-border bg-white px-6 py-10 text-center text-sm text-muted">
        <span className="inline-flex items-center gap-2">
          Loading schedule
          <LoadingDots label="Loading schedule" />
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
        {getApiErrorMessage(error, "Could not load weekly schedule")}
      </p>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <article className="overflow-hidden rounded-2xl bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
      <div className="border-b border-stone-100 px-5 py-4">
        <p className="text-sm text-muted">
          {data.yearTitle} · {data.className} · Section {data.sectionTitle}
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-center text-sm">
          <thead>
            <tr className="bg-primary text-on-primary">
              <th className="w-16 border border-primary-hover/30 px-3 py-3.5">
                <span className="inline-flex items-center justify-center">
                  <CalendarDays className="h-4 w-4" aria-hidden />
                  <span className="sr-only">Session</span>
                </span>
              </th>
              {data.days.map((day) => (
                <th
                  key={day.id}
                  className="min-w-[8.5rem] border border-primary-hover/30 px-3 py-3.5 text-xs font-semibold uppercase tracking-wide"
                >
                  {day.dayName}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.sessions.map((session, rowIndex) => (
              <tr
                key={session.id}
                className={rowIndex % 2 === 0 ? "bg-white" : "bg-primary-soft/40"}
              >
                <td className="border border-stone-200 px-3 py-4 text-sm font-semibold text-foreground">
                  {session.position}
                </td>
                {data.days.map((day) => {
                  const cell = cellMap.get(`${day.id}:${session.id}`);
                  return (
                    <td
                      key={`${session.id}-${day.id}`}
                      className="border border-stone-200 px-3 py-4 align-middle"
                    >
                      {cell?.courseTitle ? (
                        <span className="text-sm font-medium text-foreground">
                          {cell.courseTitle}
                        </span>
                      ) : null}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </article>
  );
}
