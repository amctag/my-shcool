"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { getApiErrorMessage } from "@/lib/getApiErrorMessage";
import { selectAuthReady } from "@/features/auth/authSlice";
import { useGetClassesQuery } from "@/features/school/api/classesApi";
import { useGetCoursesQuery } from "@/features/school/api/coursesApi";
import { useGetSectionsQuery, useGetYearsQuery } from "@/features/school/api/sectionsApi";
import { useGetTeachersQuery } from "@/features/school/api/teachersApi";
import {
  useCreateTeachMutation,
  useGetTeachesQuery,
  useGetTeachQuery,
  useUpdateTeachMutation,
} from "@/features/school/api/teachesApi";
import { useAppSelector } from "@/store/hooks";
import type { SaveTeachBody } from "@/features/school/types";

const inputClass =
  "h-11 w-full rounded-xl border border-border bg-white px-3 text-sm text-foreground outline-none transition-colors duration-200 placeholder:text-muted/80 focus:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

type FormState = {
  yearId: string;
  classId: string;
  sectionId: string;
  courseId: string;
  teacherId: string;
};

function emptyForm(): FormState {
  return {
    yearId: "",
    classId: "",
    sectionId: "",
    courseId: "",
    teacherId: "",
  };
}

function Field({
  id,
  label,
  required,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <label htmlFor={id} className="block min-w-0 flex-1">
      <span className="mb-1.5 block text-sm font-medium text-foreground">
        {label}
        {required ? " *" : ""}
      </span>
      {children}
    </label>
  );
}

function teacherLabel(teacher: {
  firstName?: string;
  lastName?: string;
  fullName: string;
}): string {
  const name = `${teacher.firstName ?? ""} ${teacher.lastName ?? ""}`.trim();
  return name || teacher.fullName;
}

export function TeachForm({
  teachId,
  readOnly = false,
}: {
  teachId?: number;
  readOnly?: boolean;
}) {
  const router = useRouter();
  const authReady = useAppSelector(selectAuthReady);
  const isEdit = Boolean(teachId) && !readOnly;
  const [form, setForm] = useState<FormState>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);

  const yearId = Number(form.yearId) || 0;
  const classId = Number(form.classId) || 0;
  const sectionId = Number(form.sectionId) || 0;

  const { data: item, isLoading } = useGetTeachQuery(teachId ?? 0, {
    skip: !authReady || !teachId,
  });
  const { data: classes = [] } = useGetClassesQuery(undefined, {
    skip: !authReady,
  });
  const { data: courses = [] } = useGetCoursesQuery(undefined, {
    skip: !authReady,
  });
  const { data: years = [] } = useGetYearsQuery(undefined, {
    skip: !authReady,
  });
  const { data: teachersData } = useGetTeachersQuery(
    { page: 1, limit: 100, sortBy: "name", sortOrder: "asc" },
    { skip: !authReady },
  );
  const { data: sectionsData } = useGetSectionsQuery(
    {
      page: 1,
      limit: 100,
      classId,
      yearId,
      sortBy: "section",
      sortOrder: "asc",
    },
    { skip: !authReady || !classId || !yearId },
  );
  const { data: sectionTeaches } = useGetTeachesQuery(
    {
      page: 1,
      limit: 100,
      sectionId,
      yearId,
      sortBy: "id",
      sortOrder: "asc",
    },
    { skip: !authReady || !sectionId || !yearId },
  );
  const [createTeach, createState] = useCreateTeachMutation();
  const [updateTeach, updateState] = useUpdateTeachMutation();
  const saving = createState.isLoading || updateState.isLoading;
  const teachers = teachersData?.items ?? [];
  const sections = sectionsData?.items ?? [];
  const usedCourseIds = useMemo(() => {
    const ids = new Set<number>();
    for (const row of sectionTeaches?.items ?? []) {
      if (teachId && row.id === teachId) {
        continue;
      }
      ids.add(row.courseId);
    }
    return ids;
  }, [sectionTeaches?.items, teachId]);

  useEffect(() => {
    if (teachId || form.yearId) {
      return;
    }
    const current = years.find((year) => year.isCurrent) ?? years[0];
    if (!current) {
      return;
    }
    setForm((currentForm) =>
      currentForm.yearId
        ? currentForm
        : { ...currentForm, yearId: String(current.id) },
    );
  }, [form.yearId, teachId, years]);

  useEffect(() => {
    if (!item) {
      return;
    }
    setForm({
      yearId: String(item.yearId),
      classId: String(item.classId),
      sectionId: String(item.sectionId),
      courseId: String(item.courseId),
      teacherId: String(item.teacherId),
    });
  }, [item]);

  async function onSave() {
    setFormError(null);
    const teacherId = Number(form.teacherId);
    const sectionId = Number(form.sectionId);
    const courseId = Number(form.courseId);
    const selectedYearId = Number(form.yearId);
    if (!teacherId || !sectionId || !courseId || !selectedYearId || !classId) {
      setFormError("Teacher, class, section, course, and year are required");
      return;
    }
    if (usedCourseIds.has(courseId)) {
      setFormError("This section already has a teacher for that course this year");
      return;
    }

    const body: SaveTeachBody = {
      teacherId,
      sectionId,
      courseId,
      yearId: selectedYearId,
    };

    try {
      if (teachId) {
        await updateTeach({ id: teachId, body }).unwrap();
      } else {
        await createTeach(body).unwrap();
      }
      router.push("/teaches");
    } catch (caught) {
      setFormError(getApiErrorMessage(caught, "Could not save teach"));
    }
  }

  if (teachId && isLoading) {
    return <p className="text-sm text-muted">Loading teach…</p>;
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (!readOnly) {
          void onSave();
        }
      }}
      className="rounded-3xl border border-border bg-white p-6 shadow-sm sm:p-8"
    >
      <h1 className="mb-8 text-center text-3xl font-semibold tracking-tight text-foreground">
        {readOnly ? "View teach" : isEdit ? "Edit teach" : "Add teach"}
      </h1>
      <fieldset disabled={readOnly} className="min-w-0 border-0 p-0">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="yearId" label="Year" required>
            <select
              id="yearId"
              required
              value={form.yearId}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  yearId: event.target.value,
                  sectionId: "",
                }))
              }
              className={`${inputClass} cursor-pointer`}
            >
              <option value="">Choose year</option>
              {years.map((year) => (
                <option key={year.id} value={String(year.id)}>
                  {year.title}
                  {year.isCurrent ? " (current)" : ""}
                </option>
              ))}
            </select>
          </Field>
          <Field id="classId" label="Class" required>
            <select
              id="classId"
              required
              value={form.classId}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  classId: event.target.value,
                  sectionId: "",
                }))
              }
              className={`${inputClass} cursor-pointer`}
            >
              <option value="">Choose class</option>
              {classes.map((itemClass) => (
                <option key={itemClass.id} value={String(itemClass.id)}>
                  {itemClass.className} ({itemClass.stageTitle})
                </option>
              ))}
            </select>
          </Field>
          <Field id="sectionId" label="Section" required>
            <select
              id="sectionId"
              required
              disabled={!classId || !yearId}
              value={form.sectionId}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  sectionId: event.target.value,
                }))
              }
              className={`${inputClass} cursor-pointer disabled:bg-stone-50`}
            >
              <option value="">
                {!classId || !yearId
                  ? "Choose class and year first"
                  : "Choose section"}
              </option>
              {sections.map((section) => (
                <option key={section.id} value={String(section.id)}>
                  {section.sectionTitle}
                </option>
              ))}
            </select>
          </Field>
          <Field id="courseId" label="Course" required>
            <select
              id="courseId"
              required
              value={form.courseId}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  courseId: event.target.value,
                }))
              }
              className={`${inputClass} cursor-pointer`}
            >
              <option value="">Choose course</option>
              {courses.map((course) => {
                const used = usedCourseIds.has(course.id);
                return (
                  <option
                    key={course.id}
                    value={String(course.id)}
                    disabled={used}
                  >
                    {used ? `${course.title} (used)` : course.title}
                  </option>
                );
              })}
            </select>
          </Field>
          <Field id="teacherId" label="Teacher" required>
            <select
              id="teacherId"
              required
              value={form.teacherId}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  teacherId: event.target.value,
                }))
              }
              className={`${inputClass} cursor-pointer`}
            >
              <option value="">Choose teacher</option>
              {teachers.map((teacher) => (
                <option key={teacher.id} value={String(teacher.id)}>
                  {teacherLabel(teacher)}
                </option>
              ))}
            </select>
          </Field>
        </div>
        {formError ? (
          <p className="mt-4 text-sm text-red-600">{formError}</p>
        ) : null}
        {readOnly ? null : (
          <div className="mt-8 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setForm(emptyForm())}
              className="h-11 cursor-pointer rounded-xl bg-primary px-5 text-sm font-medium text-on-primary hover:bg-primary-hover"
            >
              Reset
            </button>
            <button
              type="submit"
              disabled={saving}
              className="h-11 cursor-pointer rounded-xl bg-foreground px-5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        )}
      </fieldset>
    </form>
  );
}
