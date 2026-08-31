"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, Pencil, Plus, Trash2 } from "lucide-react";
import { ScheduleCourseDrawer } from "@/features/school/components/ScheduleCourseDrawer";
import { LoadingDots } from "@/components/dashboard/TableLoading";
import { getApiErrorMessage } from "@/lib/getApiErrorMessage";
import { useGetClassCoursesQuery } from "@/features/school/api/coursesApi";
import {
  useGetDashboardExamScheduleQuery,
  useUpdateDashboardExamScheduleMutation,
} from "@/features/school/api/examSchedulesApi";
import { selectAuthReady, selectAccessToken } from "@/features/auth/authSlice";
import { useAppSelector } from "@/store/hooks";
import type { SaveExamScheduleBody } from "@/features/school/types";

const inputClass =
  "h-11 w-full rounded-xl border border-border bg-white px-3 text-sm text-foreground outline-none transition-colors duration-200 placeholder:text-muted/80 focus:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

type ExamRow = {
  key: string;
  courseId: number;
  startTime: string;
  duration: number;
  note: string;
};

type DateRow = {
  key: string;
  date: string;
  exams: ExamRow[];
};

type EditingExam = {
  dateKey: string;
  examKey: string;
  heading: string;
};

function parseTimeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function getExamEndMinutes(exam: Pick<ExamRow, "startTime" | "duration">): number {
  return parseTimeToMinutes(exam.startTime) + exam.duration;
}

function newExamRow(): ExamRow {
  return {
    key: `exam-${crypto.randomUUID()}`,
    courseId: 0,
    startTime: "09:00",
    duration: 60,
    note: "",
  };
}

function newDateRow(): DateRow {
  return {
    key: `date-${crypto.randomUUID()}`,
    date: "",
    exams: [newExamRow()],
  };
}

function examsOverlap(exams: ExamRow[]): string | null {
  for (let index = 1; index < exams.length; index += 1) {
    const previous = exams[index - 1];
    const current = exams[index];
    const previousEnd = getExamEndMinutes(previous);
    const currentStart = parseTimeToMinutes(current.startTime);

    if (currentStart < previousEnd) {
      return `Exam ${index + 1} starts before the previous exam ends. Adjust start times so they do not overlap.`;
    }
  }
  return null;
}

function formatDisplayDate(value: string): string {
  if (!value) {
    return "Select date";
  }
  return new Intl.DateTimeFormat("en", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}

export function ExamScheduleForm({ scheduleId }: { scheduleId: number }) {
  const router = useRouter();
  const ready = useAppSelector(selectAuthReady);
  const accessToken = useAppSelector(selectAccessToken);
  const canFetch = ready && Boolean(accessToken);

  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [classId, setClassId] = useState(0);
  const [gradeTypeId, setGradeTypeId] = useState(0);
  const [yearId, setYearId] = useState<number | null>(null);
  const [gradeTypeTitle, setGradeTypeTitle] = useState("");
  const [className, setClassName] = useState("");
  const [yearTitle, setYearTitle] = useState("");
  const [dates, setDates] = useState<DateRow[]>([newDateRow()]);
  const [formError, setFormError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [editingExam, setEditingExam] = useState<EditingExam | null>(null);
  const [drawerCourseId, setDrawerCourseId] = useState(0);

  const { data: existing, isLoading: existingLoading } =
    useGetDashboardExamScheduleQuery(scheduleId, {
      skip: !canFetch,
    });

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
    { skip: !canFetch || !yearId || classId <= 0 },
  );
  const classCourses = classCoursesData?.items ?? [];

  const courseTitleById = useMemo(() => {
    const map = new Map<number, string>();
    for (const item of classCourses) {
      map.set(item.courseId, item.courseTitle);
    }
    return map;
  }, [classCourses]);

  const scheduleCourseOptions = useMemo(
    () =>
      classCourses.map((item) => ({
        courseId: item.courseId,
        courseTitle: item.courseTitle,
      })),
    [classCourses],
  );

  const [updateSchedule, updateState] =
    useUpdateDashboardExamScheduleMutation();
  const saving = updateState.isLoading;

  useEffect(() => {
    if (!existing || hydrated) {
      return;
    }
    setTitle(existing.title);
    setNote(existing.note ?? "");
    setClassId(existing.classId);
    setClassName(existing.className);
    setGradeTypeId(existing.gradeTypeId);
    setGradeTypeTitle(existing.gradeTypeTitle);
    setYearId(existing.yearId);
    setYearTitle(existing.yearTitle);
    setDates(
      existing.dates.length > 0
        ? existing.dates.map((examDate) => ({
            key: `date-${examDate.id}`,
            date: examDate.date,
            exams: examDate.exams.map((exam) => ({
              key: `exam-${exam.id}`,
              courseId: exam.courseId,
              startTime: exam.startTime,
              duration: exam.duration,
              note: exam.note ?? "",
            })),
          }))
        : [newDateRow()],
    );
    setHydrated(true);
  }, [existing, hydrated]);

  function updateDateRow(dateKey: string, patch: Partial<DateRow>) {
    setDates((current) =>
      current.map((row) => (row.key === dateKey ? { ...row, ...patch } : row)),
    );
  }

  function updateExamRow(
    dateKey: string,
    examKey: string,
    patch: Partial<ExamRow>,
  ) {
    setDates((current) =>
      current.map((dateRow) =>
        dateRow.key !== dateKey
          ? dateRow
          : {
              ...dateRow,
              exams: dateRow.exams.map((exam) =>
                exam.key === examKey ? { ...exam, ...patch } : exam,
              ),
            },
      ),
    );
  }

  function openExamEditor(
    dateRow: DateRow,
    exam: ExamRow,
    examIndex: number,
  ) {
    setEditingExam({
      dateKey: dateRow.key,
      examKey: exam.key,
      heading: `${formatDisplayDate(dateRow.date)} · Exam ${examIndex + 1}`,
    });
    setDrawerCourseId(exam.courseId);
  }

  function saveDrawerCourse() {
    if (!editingExam) {
      return;
    }
    updateExamRow(editingExam.dateKey, editingExam.examKey, {
      courseId: drawerCourseId,
    });
    setEditingExam(null);
  }

  function addExamRow(dateKey: string) {
    setDates((current) =>
      current.map((dateRow) =>
        dateRow.key !== dateKey
          ? dateRow
          : { ...dateRow, exams: [...dateRow.exams, newExamRow()] },
      ),
    );
  }

  function removeExamRow(dateKey: string, examKey: string) {
    setDates((current) =>
      current.map((dateRow) => {
        if (dateRow.key !== dateKey) {
          return dateRow;
        }
        if (dateRow.exams.length === 1) {
          return dateRow;
        }
        return {
          ...dateRow,
          exams: dateRow.exams.filter((exam) => exam.key !== examKey),
        };
      }),
    );
  }

  function validateForm(): string | null {
    if (!title.trim()) {
      return "Title is required.";
    }
    if (!classId) {
      return "Class is required.";
    }
    if (!gradeTypeId) {
      return "Grade type is required.";
    }
    if (!yearId) {
      return "Year is required.";
    }
    if (dates.length === 0) {
      return "Add at least one exam date.";
    }
    for (const dateRow of dates) {
      if (!dateRow.date) {
        return "Each exam date must have a date.";
      }
      if (dateRow.exams.length === 0) {
        return "Each date must have at least one exam.";
      }
      for (const exam of dateRow.exams) {
        if (!exam.courseId) {
          return "Each exam must have a course.";
        }
        if (!exam.startTime) {
          return "Each exam must have a start time.";
        }
        if (!exam.duration || exam.duration < 1) {
          return "Each exam must have a duration of at least 1 minute.";
        }
      }

      const overlapError = examsOverlap(dateRow.exams);
      if (overlapError) {
        return overlapError;
      }
    }
    return null;
  }

  function buildBody(): SaveExamScheduleBody {
    return {
      title: title.trim(),
      classId,
      yearId: yearId ?? undefined,
      gradeTypeId,
      note: note.trim() || undefined,
      dates: dates.map((dateRow) => ({
        date: dateRow.date,
        exams: dateRow.exams.map((exam, index) => ({
          courseId: exam.courseId,
          position: index,
          startTime: exam.startTime,
          duration: exam.duration,
          note: exam.note.trim() || undefined,
        })),
      })),
    };
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setFormError(null);
    const validationError = validateForm();
    if (validationError) {
      setFormError(validationError);
      return;
    }

    const body = buildBody();
    try {
      await updateSchedule({ id: scheduleId, body }).unwrap();
      router.push(`/exams/view?scheduleId=${scheduleId}&saved=1`);
    } catch (error) {
      setFormError(
        getApiErrorMessage(error, "Could not save exam schedule"),
      );
    }
  }

  if (existingLoading || !hydrated) {
    return (
      <p className="rounded-2xl border border-border bg-white px-6 py-10 text-center text-sm text-muted">
        <span className="inline-flex items-center gap-2">
          Loading exam schedule
          <LoadingDots label="Loading exam schedule" />
        </span>
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {formError ? (
        <p
          className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700"
          role="alert"
        >
          {formError}
        </p>
      ) : null}

      <article className="overflow-hidden rounded-2xl bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <div className="border-b border-stone-100 px-5 py-4">
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
          <p className="mt-1 text-sm text-muted">
            {yearTitle} · {className} · {gradeTypeTitle}
          </p>
          {note ? (
            <p className="mt-3 text-sm text-foreground">{note}</p>
          ) : null}
        </div>
        {dates.map((dateRow) => (
          <div key={dateRow.key} className="border-t border-stone-100">
            <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
              <div className="flex min-w-0 items-center gap-2 text-sm text-muted">
                <CalendarDays className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                <span>{formatDisplayDate(dateRow.date)}</span>
              </div>
              <label className="min-w-44">
                <span className="mb-1.5 block text-sm font-medium text-foreground">
                  Exam date *
                </span>
                <input
                  type="date"
                  className={inputClass}
                  value={dateRow.date}
                  onChange={(event) =>
                    updateDateRow(dateRow.key, { date: event.target.value })
                  }
                  required
                />
              </label>
            </div>

            <div className="overflow-x-auto px-5 pb-5">
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
                    <th className="w-16 border border-primary-hover/30 px-3 py-3.5 text-xs font-semibold uppercase tracking-wide">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {dateRow.exams.map((exam, examIndex) => {
                    const courseTitle = exam.courseId
                      ? courseTitleById.get(exam.courseId)
                      : null;

                    return (
                      <tr
                        key={exam.key}
                        className={
                          examIndex % 2 === 0 ? "bg-white" : "bg-primary-soft/40"
                        }
                      >
                        <td className="border border-stone-200 px-3 py-4 text-sm font-semibold text-foreground">
                          {examIndex + 1}
                        </td>
                        <td className="border border-stone-200 px-2 py-3 align-middle">
                          <div className="flex min-h-[3.5rem] flex-col items-center justify-center gap-1.5">
                            {courseTitle ? (
                              <span className="text-sm font-medium text-foreground">
                                {courseTitle}
                              </span>
                            ) : (
                              <span className="text-sm text-muted">
                                Select course
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() =>
                                openExamEditor(dateRow, exam, examIndex)
                              }
                              className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-muted transition-colors hover:bg-primary-soft hover:text-primary"
                              aria-label={`Edit course for exam ${examIndex + 1}`}
                            >
                              <Pencil className="h-3.5 w-3.5" aria-hidden />
                            </button>
                          </div>
                        </td>
                        <td className="border border-stone-200 px-3 py-3 align-middle">
                          <input
                            type="time"
                            className={`${inputClass} mx-auto max-w-[8rem]`}
                            value={exam.startTime}
                            onChange={(event) =>
                              updateExamRow(dateRow.key, exam.key, {
                                startTime: event.target.value,
                              })
                            }
                            required
                          />
                        </td>
                        <td className="border border-stone-200 px-3 py-3 align-middle">
                          <input
                            type="number"
                            min={1}
                            className={`${inputClass} mx-auto max-w-[6rem]`}
                            value={exam.duration}
                            onChange={(event) =>
                              updateExamRow(dateRow.key, exam.key, {
                                duration: Number(event.target.value),
                              })
                            }
                            required
                          />
                        </td>
                        <td className="border border-stone-200 px-3 py-3 align-middle">
                          <input
                            className={`${inputClass} mx-auto max-w-[12rem]`}
                            value={exam.note}
                            onChange={(event) =>
                              updateExamRow(dateRow.key, exam.key, {
                                note: event.target.value,
                              })
                            }
                            placeholder="Room, etc."
                          />
                        </td>
                        <td className="border border-stone-200 px-2 py-3 align-middle">
                          <button
                            type="button"
                            onClick={() => removeExamRow(dateRow.key, exam.key)}
                            className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-red-600 transition-colors hover:bg-red-50 disabled:opacity-40"
                            disabled={dateRow.exams.length === 1}
                            aria-label={`Remove exam ${examIndex + 1}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" aria-hidden />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  <tr className="bg-white">
                    <td
                      colSpan={6}
                      className="border border-stone-200 px-3 py-3"
                    >
                      <button
                        type="button"
                        onClick={() => addExamRow(dateRow.key)}
                        className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl border border-border px-4 text-sm font-medium hover:bg-primary-soft"
                      >
                        <Plus aria-hidden className="h-4 w-4" />
                        Add exam
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </article>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => router.push("/exams")}
          className="inline-flex h-11 cursor-pointer items-center justify-center rounded-xl border border-border px-5 text-sm font-medium hover:bg-primary-soft"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="inline-flex h-11 cursor-pointer items-center justify-center rounded-xl bg-primary px-5 text-sm font-medium text-on-primary hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save schedule"}
        </button>
      </div>

      {editingExam ? (
        <ScheduleCourseDrawer
          dayName=""
          sessionLabel=""
          heading={editingExam.heading}
          courses={scheduleCourseOptions}
          selectedCourseId={drawerCourseId}
          onSelectCourse={setDrawerCourseId}
          onSave={saveDrawerCourse}
          onClose={() => setEditingExam(null)}
          allowEmpty={false}
        />
      ) : null}
    </form>
  );
}
