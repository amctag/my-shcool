"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CalendarDays, Pencil } from "lucide-react";
import { ConfirmWarningDialog } from "@/components/dashboard/ConfirmWarningDialog";
import { FilterSelect } from "@/components/dashboard/FilterSelect";
import { LoadingDots } from "@/components/dashboard/TableLoading";
import { YearFilterSelect } from "@/components/dashboard/YearFilterSelect";
import { ScheduleCourseDrawer } from "@/features/school/components/ScheduleCourseDrawer";
import { getApiErrorMessage } from "@/lib/getApiErrorMessage";
import { useGetClassCoursesQuery } from "@/features/school/api/coursesApi";
import { useGetClassesQuery } from "@/features/school/api/classesApi";
import { useGetSectionsQuery } from "@/features/school/api/sectionsApi";
import {
  useGetDashboardWeeklyScheduleGridQuery,
  useSaveDashboardWeeklyScheduleMutation,
} from "@/features/school/api/weeklySchedulesApi";
import { useSchoolYearFilter } from "@/features/school/useSchoolYearFilter";
import { selectAuthReady, selectAccessToken } from "@/features/auth/authSlice";
import { useAppSelector } from "@/store/hooks";
import {
  getCourseHourViolations,
  getCourseHourUsageSummary,
} from "@/features/school/weeklyScheduleHours";

function cellKey(dayId: number, sessionId: number): string {
  return `${dayId}:${sessionId}`;
}

const readOnlyFieldClass =
  "flex h-11 min-w-44 items-center rounded-xl border border-border bg-stone-50 px-3 text-sm text-foreground";

function ReadOnlyFilter({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-44">
      <span className="sr-only">{label}</span>
      <div className={readOnlyFieldClass} aria-readonly="true">
        {value}
      </div>
    </div>
  );
}

type EditingCell = {
  dayId: number;
  sessionId: number;
  dayName: string;
  sessionPosition: number;
};

export function WeeklyScheduleForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const ready = useAppSelector(selectAuthReady);
  const accessToken = useAppSelector(selectAccessToken);
  const canFetch = ready && Boolean(accessToken);
  const [yearId, setYearId] = useState<number | null>(null);
  const [classId, setClassId] = useState(0);
  const [sectionId, setSectionId] = useState(0);
  const [cellCourses, setCellCourses] = useState<Record<string, number>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [showHoursWarning, setShowHoursWarning] = useState(false);
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
  const [drawerCourseId, setDrawerCourseId] = useState(0);
  const { years, yearId: defaultYearId } = useSchoolYearFilter(canFetch);

  const canLoadGrid =
    canFetch && Boolean(yearId) && classId > 0 && sectionId > 0;

  const { data: gridData, isLoading: gridLoading } =
    useGetDashboardWeeklyScheduleGridQuery(
      {
        sectionId,
        yearId: yearId ?? undefined,
        classId,
      },
      { skip: !canLoadGrid },
    );

  const { data: classesData } = useGetClassesQuery(
    { page: 1, limit: 100, sortOrder: "asc" },
    { skip: !canFetch },
  );
  const classes = classesData?.items ?? [];
  const classSelected = classId > 0;

  const { data: sectionsData, isFetching: sectionsLoading } = useGetSectionsQuery(
    {
      page: 1,
      limit: 100,
      yearId: yearId ?? undefined,
      classId,
      sortBy: "section",
      sortOrder: "asc",
    },
    { skip: !canFetch || !yearId || !classSelected },
  );
  const sections = sectionsData?.items ?? [];

  const { data: classCoursesData } = useGetClassCoursesQuery(
    {
      page: 1,
      limit: 100,
      classId,
      yearId: yearId ?? undefined,
      status: "active",
      sortBy: "course",
      sortOrder: "asc",
    },
    { skip: !canFetch || !yearId || !classSelected },
  );
  const classCourses = classCoursesData?.items ?? [];

  const [saveSchedule, { isLoading: saving }] =
    useSaveDashboardWeeklyScheduleMutation();

  useEffect(() => {
    if (!defaultYearId) {
      return;
    }
    setYearId((current) => current ?? defaultYearId);
  }, [defaultYearId]);

  useEffect(() => {
    const queryYearId = Number(searchParams.get("yearId"));
    const queryClassId = Number(searchParams.get("classId"));
    const querySectionId = Number(searchParams.get("sectionId"));

    if (queryYearId > 0) {
      setYearId(queryYearId);
    }
    if (queryClassId > 0) {
      setClassId(queryClassId);
    }
    if (querySectionId > 0) {
      setSectionId(querySectionId);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!gridData) {
      return;
    }
    const next: Record<string, number> = {};
    for (const cell of gridData.cells) {
      if (cell.courseId) {
        next[cellKey(cell.dayId, cell.sessionId)] = cell.courseId;
      }
    }
    setCellCourses(next);
  }, [gridData]);

  const days = gridData?.days ?? [];
  const sessions = gridData?.sessions ?? [];
  const isEditing = Boolean(gridData?.scheduleId);
  const querySectionId = Number(searchParams.get("sectionId"));
  const queryClassId = Number(searchParams.get("classId"));
  const isSelectionReadOnly =
    isEditing || (querySectionId > 0 && queryClassId > 0);

  const selectedYear = years.find((year) => year.id === yearId);
  const yearLabel = selectedYear
    ? selectedYear.isCurrent
      ? `${selectedYear.title} (current)`
      : selectedYear.title
    : gridData?.yearTitle ?? "—";
  const classLabel =
    classes.find((item) => item.id === classId)?.className ??
    gridData?.className ??
    "—";
  const sectionLabel =
    sections.find((item) => item.id === sectionId)?.sectionTitle ??
    gridData?.sectionTitle ??
    "—";

  const courseOptions = useMemo(
    () =>
      classCourses.map((item) => ({
        courseId: item.courseId,
        courseTitle: item.courseTitle,
      })),
    [classCourses],
  );

  const courseTitleById = useMemo(() => {
    const map = new Map<number, string>();
    for (const course of courseOptions) {
      map.set(course.courseId, course.courseTitle);
    }
    return map;
  }, [courseOptions]);

  const hourViolations = useMemo(
    () => getCourseHourViolations(cellCourses, classCourses),
    [cellCourses, classCourses],
  );

  const hourUsageSummary = useMemo(
    () => getCourseHourUsageSummary(cellCourses, classCourses),
    [cellCourses, classCourses],
  );

  function buildEntries() {
    return Object.entries(cellCourses).map(([key, courseId]) => {
      const [dayId, sessionId] = key.split(":").map(Number);
      return { dayId, sessionId, courseId };
    });
  }

  async function saveScheduleNow() {
    if (!yearId || classId <= 0 || sectionId <= 0) {
      setFormError("Please select year, class, and section.");
      return;
    }

    try {
      await saveSchedule({
        sectionId,
        yearId,
        classId,
        entries: buildEntries(),
      }).unwrap();
      setShowHoursWarning(false);
      router.push(
        `/schedule?yearId=${yearId}&classId=${classId}&sectionId=${sectionId}&saved=1`,
      );
    } catch (error) {
      setFormError(
        getApiErrorMessage(error, "Could not save weekly schedule"),
      );
    }
  }

  function updateCell(dayId: number, sessionId: number, courseId: number) {
    const key = cellKey(dayId, sessionId);
    setCellCourses((current) => {
      const next = { ...current };
      if (courseId > 0) {
        next[key] = courseId;
      } else {
        delete next[key];
      }
      return next;
    });
  }

  function openCellEditor(
    day: { id: number; dayName: string },
    session: { id: number; position: number },
  ) {
    const key = cellKey(day.id, session.id);
    setEditingCell({
      dayId: day.id,
      sessionId: session.id,
      dayName: day.dayName,
      sessionPosition: session.position,
    });
    setDrawerCourseId(cellCourses[key] ?? 0);
  }

  function saveDrawerCourse() {
    if (!editingCell) {
      return;
    }
    updateCell(editingCell.dayId, editingCell.sessionId, drawerCourseId);
    setEditingCell(null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    if (!yearId || classId <= 0 || sectionId <= 0) {
      setFormError("Please select year, class, and section.");
      return;
    }

    if (hourViolations.length > 0) {
      setShowHoursWarning(true);
      return;
    }

    await saveScheduleNow();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <article className="rounded-2xl border border-border bg-white p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <div className="flex flex-wrap items-end gap-2">
          {isSelectionReadOnly ? (
            <>
              <ReadOnlyFilter label="Year" value={yearLabel} />
              <ReadOnlyFilter label="Class" value={classLabel} />
              <ReadOnlyFilter label="Section" value={sectionLabel} />
            </>
          ) : (
            <>
              <YearFilterSelect
                years={years}
                value={yearId}
                onChange={(nextYearId) => {
                  setYearId(nextYearId);
                  setClassId(0);
                  setSectionId(0);
                  setCellCourses({});
                }}
              />
              <FilterSelect
                label="Class"
                value={classId}
                options={[
                  { value: 0, label: "Select class" },
                  ...classes.map((itemClass) => ({
                    value: itemClass.id,
                    label: itemClass.className,
                  })),
                ]}
                onChange={(nextClassId) => {
                  setClassId(nextClassId);
                  setSectionId(0);
                  setCellCourses({});
                }}
              />
              <FilterSelect
                label="Section"
                value={sectionId}
                disabled={!classSelected}
                options={
                  !classSelected
                    ? [{ value: 0, label: "Select a class first" }]
                    : sectionsLoading
                      ? [{ value: 0, label: "Loading sections…" }]
                      : [
                          { value: 0, label: "Select section" },
                          ...sections.map((section) => ({
                            value: section.id,
                            label: section.sectionTitle,
                          })),
                        ]
                }
                onChange={(nextSectionId) => {
                  setSectionId(nextSectionId);
                  setCellCourses({});
                }}
              />
            </>
          )}
        </div>
      </article>

      {formError ? (
        <p
          className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700"
          role="alert"
        >
          {formError}
        </p>
      ) : null}

      {hourViolations.length > 0 ? (
        <div
          className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-950"
          role="status"
        >
          <p className="font-medium">Weekly hours exceeded</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {hourViolations.map((violation) => (
              <li key={violation.courseId}>
                <span className="font-medium">{violation.courseTitle}</span>: you
                scheduled {violation.usedHours} hours, but this course allows only{" "}
                {violation.allowedHours} hours per week.
              </li>
            ))}
          </ul>
          <p className="mt-2 text-amber-900">
            Fix the schedule or click Save to continue anyway.
          </p>
        </div>
      ) : hourUsageSummary.length > 0 ? (
        <div className="rounded-2xl border border-border bg-white px-5 py-4 text-sm text-muted">
          <p className="font-medium text-foreground">Weekly hours usage</p>
          <ul className="mt-2 space-y-1">
            {hourUsageSummary.map((usage) => (
              <li key={usage.courseId}>
                {usage.courseTitle}: {usage.usedHours} / {usage.allowedHours} hours
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <article className="overflow-hidden rounded-2xl bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        {!canLoadGrid ? (
          <p className="px-5 py-12 text-center text-sm text-muted">
            Select year, class, and section to build the weekly schedule.
          </p>
        ) : gridLoading ? (
          <p className="px-5 py-12 text-center text-sm text-muted">
            <span className="inline-flex items-center gap-2">
              Loading schedule template
              <LoadingDots label="Loading schedule template" />
            </span>
          </p>
        ) : (
          <>
            {gridData ? (
              <div className="border-b border-stone-100 px-5 py-4">
                <p className="text-sm text-muted">
                  {gridData.yearTitle} · {gridData.className} · Section{" "}
                  {gridData.sectionTitle}
                  {isEditing ? " · editing existing schedule" : ""}
                </p>
              </div>
            ) : null}

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
                    {days.map((day) => (
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
                  {sessions.length === 0 ? (
                    <tr>
                      <td
                        colSpan={Math.max(days.length + 1, 2)}
                        className="px-5 py-10 text-center text-sm text-muted"
                      >
                        No sessions are configured for this school.
                      </td>
                    </tr>
                  ) : (
                    sessions.map((session, rowIndex) => (
                      <tr
                        key={session.id}
                        className={
                          rowIndex % 2 === 0 ? "bg-white" : "bg-primary-soft/40"
                        }
                      >
                        <td className="border border-stone-200 px-3 py-4 text-sm font-semibold text-foreground">
                          {session.position}
                        </td>
                        {days.map((day) => {
                          const key = cellKey(day.id, session.id);
                          const courseId = cellCourses[key] ?? 0;
                          const courseTitle = courseId
                            ? courseTitleById.get(courseId)
                            : null;

                          return (
                            <td
                              key={`${session.id}-${day.id}`}
                              className="border border-stone-200 px-2 py-3 align-middle"
                            >
                              <div className="flex flex-col items-center justify-center gap-1.5 min-h-[3.5rem]">
                                {courseTitle ? (
                                  <span className="text-sm font-medium text-foreground">
                                    {courseTitle}
                                  </span>
                                ) : null}
                                <button
                                  type="button"
                                  onClick={() => openCellEditor(day, session)}
                                  className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-muted transition-colors hover:bg-primary-soft hover:text-primary"
                                  aria-label={`Edit course for ${day.dayName}, period ${session.position}`}
                                >
                                  <Pencil className="h-3.5 w-3.5" aria-hidden />
                                </button>
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </article>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => router.push("/schedule")}
          className="inline-flex h-11 cursor-pointer items-center justify-center rounded-xl border border-border px-5 text-sm font-medium hover:bg-primary-soft"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!canLoadGrid || saving || gridLoading}
          className="inline-flex h-11 cursor-pointer items-center justify-center rounded-xl bg-primary px-5 text-sm font-medium text-on-primary hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? "Saving…" : isEditing ? "Update schedule" : "Save schedule"}
        </button>
      </div>

      {showHoursWarning ? (
        <ConfirmWarningDialog
          title="Weekly hours exceeded"
          description="Some courses are scheduled for more hours than allowed this week. You can go back and fix the schedule, or save anyway."
          confirmLabel="Save anyway"
          busy={saving}
          onCancel={() => setShowHoursWarning(false)}
          onConfirm={() => void saveScheduleNow()}
        >
          <ul className="mt-4 space-y-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
            {hourViolations.map((violation) => (
              <li key={violation.courseId}>
                <span className="font-medium">{violation.courseTitle}</span>:{" "}
                {violation.usedHours} hours scheduled, {violation.allowedHours}{" "}
                allowed per week
              </li>
            ))}
          </ul>
        </ConfirmWarningDialog>
      ) : null}

      {editingCell ? (
        <ScheduleCourseDrawer
          dayName={editingCell.dayName}
          sessionLabel={String(editingCell.sessionPosition)}
          courses={courseOptions}
          selectedCourseId={drawerCourseId}
          onSelectCourse={setDrawerCourseId}
          onSave={saveDrawerCourse}
          onClose={() => setEditingCell(null)}
        />
      ) : null}
    </form>
  );
}
