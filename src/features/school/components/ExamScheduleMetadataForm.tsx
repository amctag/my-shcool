"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FilterSelect } from "@/components/dashboard/FilterSelect";
import { getApiErrorMessage } from "@/lib/getApiErrorMessage";
import { useGetClassesQuery } from "@/features/school/api/classesApi";
import {
  useCreateDashboardExamScheduleMutation,
  useGetDashboardGradeTypesQuery,
} from "@/features/school/api/examSchedulesApi";
import { useSchoolYearFilter } from "@/features/school/useSchoolYearFilter";
import { selectAuthReady, selectAccessToken } from "@/features/auth/authSlice";
import { useAppSelector } from "@/store/hooks";

const inputClass =
  "h-11 w-full rounded-xl border border-border bg-white px-3 text-sm text-foreground outline-none transition-colors duration-200 placeholder:text-muted/80 focus:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

export function ExamScheduleMetadataForm() {
  const router = useRouter();
  const ready = useAppSelector(selectAuthReady);
  const accessToken = useAppSelector(selectAccessToken);
  const canFetch = ready && Boolean(accessToken);
  const { yearId: defaultYearId } = useSchoolYearFilter(canFetch);

  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [classId, setClassId] = useState(0);
  const [gradeTypeId, setGradeTypeId] = useState(0);
  const [formError, setFormError] = useState<string | null>(null);

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
    if (!defaultYearId) {
      setFormError("Year is required.");
      return;
    }

    try {
      await createSchedule({
        title: title.trim(),
        classId,
        yearId: defaultYearId,
        gradeTypeId,
        note: note.trim() || undefined,
        dates: [],
      }).unwrap();
      router.push("/exams?saved=1");
    } catch (error) {
      setFormError(getApiErrorMessage(error, "Could not save exam"));
    }
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
          disabled={createState.isLoading}
          className="inline-flex h-11 cursor-pointer items-center justify-center rounded-xl bg-primary px-5 text-sm font-medium text-on-primary hover:bg-primary-hover disabled:opacity-50"
        >
          {createState.isLoading ? "Saving…" : "Save"}
        </button>
      </div>
    </form>
  );
}
