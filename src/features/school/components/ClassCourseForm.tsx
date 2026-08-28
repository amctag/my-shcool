"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { getApiErrorMessage } from "@/lib/getApiErrorMessage";
import { selectAuthReady } from "@/features/auth/authSlice";
import { useGetClassesQuery } from "@/features/school/api/classesApi";
import {
  useCreateClassCourseMutation,
  useGetClassCourseQuery,
  useGetCoursesQuery,
  useUpdateClassCourseMutation,
} from "@/features/school/api/coursesApi";
import { useGetYearsQuery } from "@/features/school/api/sectionsApi";
import { useAppSelector } from "@/store/hooks";
import type { SaveClassCourseBody } from "@/features/school/types";

const inputClass =
  "h-11 w-full rounded-xl border border-border bg-white px-3 text-sm text-foreground outline-none transition-colors duration-200 placeholder:text-muted/80 focus:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

type FormState = {
  classId: string;
  courseId: string;
  yearId: string;
  numberOfHours: string;
  coefficient: string;
  status: string;
};

function emptyForm(): FormState {
  return {
    classId: "",
    courseId: "",
    yearId: "",
    numberOfHours: "",
    coefficient: "1",
    status: "1",
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

export function ClassCourseForm({
  classCourseId,
  readOnly = false,
}: {
  classCourseId?: number;
  readOnly?: boolean;
}) {
  const router = useRouter();
  const authReady = useAppSelector(selectAuthReady);
  const isEdit = Boolean(classCourseId) && !readOnly;
  const [form, setForm] = useState<FormState>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);

  const { data: item, isLoading } = useGetClassCourseQuery(classCourseId ?? 0, {
    skip: !authReady || !classCourseId,
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
  const [createItem, createState] = useCreateClassCourseMutation();
  const [updateItem, updateState] = useUpdateClassCourseMutation();
  const saving = createState.isLoading || updateState.isLoading;
  const courseOptions = useMemo(
    () =>
      courses.filter(
        (course) => course.status || String(course.id) === form.courseId,
      ),
    [courses, form.courseId],
  );

  useEffect(() => {
    if (classCourseId || form.yearId) {
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
  }, [classCourseId, form.yearId, years]);

  useEffect(() => {
    if (!item) {
      return;
    }
    setForm({
      classId: String(item.classId),
      courseId: String(item.courseId),
      yearId: String(item.yearId),
      numberOfHours: item.numberOfHours == null ? "" : String(item.numberOfHours),
      coefficient: String(item.coefficient),
      status: item.status ? "1" : "0",
    });
  }, [item]);

  async function onSave() {
    setFormError(null);
    const classId = Number(form.classId);
    const courseId = Number(form.courseId);
    const yearId = Number(form.yearId);
    if (!classId || !courseId || !yearId) {
      setFormError("Class, course, and year are required");
      return;
    }

    const hours = form.numberOfHours.trim();
    const body: SaveClassCourseBody = {
      classId,
      courseId,
      yearId,
      coefficient: Number(form.coefficient) || 1,
      numberOfHours: hours === "" ? null : Number(hours),
      status: form.status !== "0",
    };

    try {
      if (classCourseId) {
        await updateItem({ id: classCourseId, body }).unwrap();
      } else {
        await createItem(body).unwrap();
      }
      router.push("/class-courses");
    } catch (caught) {
      setFormError(getApiErrorMessage(caught, "Could not save class course"));
    }
  }

  if (classCourseId && isLoading) {
    return <p className="text-sm text-muted">Loading class course…</p>;
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
        {readOnly
          ? "View class course"
          : isEdit
            ? "Edit class course"
            : "Add class course"}
      </h1>
      <fieldset disabled={readOnly} className="min-w-0 border-0 p-0">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="classId" label="Class" required>
            <select
              id="classId"
              required
              value={form.classId}
              onChange={(event) =>
                setForm((current) => ({ ...current, classId: event.target.value }))
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
          <Field id="courseId" label="Course" required>
            <select
              id="courseId"
              required
              value={form.courseId}
              onChange={(event) =>
                setForm((current) => ({ ...current, courseId: event.target.value }))
              }
              className={`${inputClass} cursor-pointer`}
            >
              <option value="">Choose course</option>
              {courseOptions.map((course) => (
                <option key={course.id} value={String(course.id)}>
                  {course.title}
                </option>
              ))}
            </select>
          </Field>
          <Field id="yearId" label="Year" required>
            <select
              id="yearId"
              required
              value={form.yearId}
              onChange={(event) =>
                setForm((current) => ({ ...current, yearId: event.target.value }))
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
          <Field id="numberOfHours" label="Hours per week">
            <input
              id="numberOfHours"
              type="number"
              min={0}
              max={40}
              value={form.numberOfHours}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  numberOfHours: event.target.value,
                }))
              }
              placeholder="5"
              className={inputClass}
            />
          </Field>
          <Field id="coefficient" label="Coefficient">
            <input
              id="coefficient"
              type="number"
              min={0}
              max={99}
              step="0.25"
              value={form.coefficient}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  coefficient: event.target.value,
                }))
              }
              className={inputClass}
            />
          </Field>
          <Field id="status" label="Status">
            <select
              id="status"
              value={form.status}
              onChange={(event) =>
                setForm((current) => ({ ...current, status: event.target.value }))
              }
              className={`${inputClass} cursor-pointer`}
            >
              <option value="1">Active</option>
              <option value="0">Inactive</option>
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
