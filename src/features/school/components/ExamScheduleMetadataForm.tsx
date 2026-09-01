"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FilterSelect } from "@/components/dashboard/FilterSelect";
import { LoadingDots } from "@/components/dashboard/TableLoading";
import { getApiErrorMessage } from "@/lib/getApiErrorMessage";
import { useGetClassesQuery } from "@/features/school/api/classesApi";
import {
  useCreateDashboardExamScheduleMutation,
  useGetDashboardExamScheduleQuery,
  useGetDashboardGradeTypesQuery,
  useUpdateDashboardExamScheduleMutation,
} from "@/features/school/api/examSchedulesApi";
import { useSchoolYearFilter } from "@/features/school/useSchoolYearFilter";
import { selectAuthReady, selectAccessToken } from "@/features/auth/authSlice";
import { useAppSelector } from "@/store/hooks";
import type {
  SaveExamScheduleBody,
  SaveExamScheduleDateBody,
} from "@/features/school/types";

const inputClass =
  "h-11 w-full rounded-xl border border-border bg-white px-3 text-sm text-foreground outline-none transition-colors duration-200 placeholder:text-muted/80 focus:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

export function ExamScheduleMetadataForm({
  scheduleId,
}: {
  scheduleId?: number;
}) {
  const router = useRouter();
  const isEditing = Boolean(scheduleId);
  const ready = useAppSelector(selectAuthReady);
  const accessToken = useAppSelector(selectAccessToken);
  const canFetch = ready && Boolean(accessToken);
  const { yearId: defaultYearId } = useSchoolYearFilter(canFetch);

  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [examDate, setExamDate] = useState("");
  const [classId, setClassId] = useState(0);
  const [gradeTypeId, setGradeTypeId] = useState(0);
  const [yearId, setYearId] = useState<number | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [existingDates, setExistingDates] = useState<SaveExamScheduleDateBody[]>(
    [],
  );

  const { data: existing, isLoading: existingLoading } =
    useGetDashboardExamScheduleQuery(scheduleId ?? 0, {
      skip: !canFetch || !isEditing,
    });

  const { data: gradeTypesData } = useGetDashboardGradeTypesQuery(undefined, {
    skip: !canFetch,
  });
  const gradeTypes = gradeTypesData?.items ?? [];

  const { data: classesData } = useGetClassesQuery(
    { page: 1, limit: 100, sortOrder: "asc" },
    { skip: !canFetch },
  );
  const classes = classesData?.items ?? [];

  const [createSchedule, createState] = useCreateDashboardExamScheduleMutation();
  const [updateSchedule, updateState] = useUpdateDashboardExamScheduleMutation();
  const saving = createState.isLoading || updateState.isLoading;

  useEffect(() => {
    if (!existing || hydrated) {
      return;
    }
    setTitle(existing.title);
    setNote(existing.note ?? "");
    setExamDate(existing.dates[0]?.date ?? "");
    setClassId(existing.classId);
    setGradeTypeId(existing.gradeTypeId);
    setYearId(existing.yearId);
    setExistingDates(
      existing.dates.map((examDate) => ({
        date: examDate.date,
        exams: examDate.exams.map((exam, index) => ({
          courseId: exam.courseId,
          position: index,
          startTime: exam.startTime,
          duration: exam.duration,
          note: exam.note ?? undefined,
        })),
      })),
    );
    setHydrated(true);
  }, [existing, hydrated]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setFormError(null);

    if (!title.trim()) {
      setFormError("Title is required.");
      return;
    }
    if (!classId) {
      setFormError("Class is required.");
      return;
    }
    if (!gradeTypeId) {
      setFormError("Grade type is required.");
      return;
    }
    if (!examDate) {
      setFormError("Exam date is required.");
      return;
    }

    const resolvedYearId = yearId ?? defaultYearId;
    if (!resolvedYearId) {
      setFormError("Year is required.");
      return;
    }

    const datesPayload: SaveExamScheduleBody["dates"] = isEditing
      ? existingDates.length > 0
        ? existingDates.map((dateRow, index) =>
            index === 0 ? { ...dateRow, date: examDate } : dateRow,
          )
        : [{ date: examDate, exams: [] }]
      : [{ date: examDate, exams: [] }];

    const body: SaveExamScheduleBody = {
      title: title.trim(),
      classId,
      yearId: resolvedYearId,
      gradeTypeId,
      note: note.trim() || undefined,
      dates: datesPayload,
    };

    try {
      if (isEditing && scheduleId) {
        await updateSchedule({ id: scheduleId, body }).unwrap();
        router.push("/exams?updated=1");
      } else {
        await createSchedule(body).unwrap();
        router.push("/exams?saved=1");
      }
    } catch (error) {
      setFormError(
        getApiErrorMessage(error, isEditing ? "Could not update exam" : "Could not save exam"),
      );
    }
  }

  if (isEditing && (existingLoading || !hydrated)) {
    return (
      <p className="rounded-2xl border border-border bg-white px-6 py-10 text-center text-sm text-muted">
        <span className="inline-flex items-center gap-2">
          Loading exam
          <LoadingDots label="Loading exam" />
        </span>
      </p>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-border bg-white p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)]"
    >
      {formError ? (
        <p
          className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          role="alert"
        >
          {formError}
        </p>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <label className="md:col-span-2">
          <span className="mb-1.5 block text-sm font-medium text-foreground">
            Title *
          </span>
          <input
            className={inputClass}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Midterm exams 2026"
            required
          />
        </label>
        <FilterSelect
          label="Class *"
          value={classId}
          options={[
            { value: 0, label: "Select class" },
            ...classes.map((item) => ({
              value: item.id,
              label: item.className,
            })),
          ]}
          onChange={setClassId}
        />
        <FilterSelect
          label="Grade type *"
          value={gradeTypeId}
          options={[
            { value: 0, label: "Select grade type" },
            ...gradeTypes.map((item) => ({
              value: item.id,
              label: item.title,
            })),
          ]}
          onChange={setGradeTypeId}
        />
        <label>
          <span className="mb-1.5 block text-sm font-medium text-foreground">
            Exam date *
          </span>
          <input
            type="date"
            className={inputClass}
            value={examDate}
            onChange={(event) => setExamDate(event.target.value)}
            required
          />
        </label>
        <p className="md:col-span-2 rounded-xl border border-stone-100 bg-primary-soft/30 px-4 py-3 text-sm text-muted">
          This date is used as the first day in the schedule editor. You can add
          more dates and courses after saving.
        </p>
        <label className="md:col-span-2">
          <span className="mb-1.5 block text-sm font-medium text-foreground">
            Note
          </span>
          <textarea
            className="min-h-24 w-full rounded-xl border border-border bg-white px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Optional instructions for students and parents"
          />
        </label>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
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
          className="inline-flex h-11 cursor-pointer items-center justify-center rounded-xl bg-primary px-5 text-sm font-medium text-on-primary hover:bg-primary-hover disabled:opacity-50"
        >
          {saving ? "Saving…" : isEditing ? "Update" : "Save"}
        </button>
      </div>
    </form>
  );
}
