"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { getApiErrorMessage } from "@/lib/getApiErrorMessage";
import { selectAuthReady } from "@/features/auth/authSlice";
import {
  useCreateCourseMutation,
  useGetCourseQuery,
  useUpdateCourseMutation,
} from "@/features/school/api/coursesApi";
import { useAppSelector } from "@/store/hooks";

const inputClass =
  "h-11 w-full rounded-xl border border-border bg-white px-3 text-sm text-foreground outline-none transition-colors duration-200 placeholder:text-muted/80 focus:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

type FormState = {
  title: string;
  description: string;
  status: string;
};

function emptyForm(): FormState {
  return { title: "", description: "", status: "1" };
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

export function CourseForm({
  courseId,
  readOnly = false,
}: {
  courseId?: number;
  readOnly?: boolean;
}) {
  const router = useRouter();
  const authReady = useAppSelector(selectAuthReady);
  const isEdit = Boolean(courseId) && !readOnly;
  const [form, setForm] = useState<FormState>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);

  const { data: item, isLoading } = useGetCourseQuery(courseId ?? 0, {
    skip: !authReady || !courseId,
  });
  const [createCourse, createState] = useCreateCourseMutation();
  const [updateCourse, updateState] = useUpdateCourseMutation();
  const saving = createState.isLoading || updateState.isLoading;

  useEffect(() => {
    if (!item) {
      return;
    }
    setForm({
      title: item.title,
      description: item.description ?? "",
      status: item.status ? "1" : "0",
    });
  }, [item]);

  async function onSave() {
    setFormError(null);
    const title = form.title.trim();
    if (!title) {
      setFormError("Title is required");
      return;
    }

    const body = {
      title,
      description: form.description.trim(),
      status: form.status !== "0",
    };

    try {
      if (isEdit && courseId) {
        await updateCourse({ id: courseId, body }).unwrap();
      } else {
        await createCourse(body).unwrap();
      }
      router.push("/courses");
    } catch (caught) {
      setFormError(getApiErrorMessage(caught, "Could not save course"));
    }
  }

  if (courseId && isLoading) {
    return <p className="text-sm text-muted">Loading course…</p>;
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (!readOnly) {
          void onSave();
        }
      }}
      className="rounded-2xl bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] sm:p-8"
    >
      <fieldset disabled={readOnly || saving}>
        <h1 className="mb-6 text-xl font-semibold text-foreground">
          {readOnly ? "Course" : isEdit ? "Edit course" : "Add course"}
        </h1>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="title" label="Title" required>
            <input
              id="title"
              required
              maxLength={255}
              value={form.title}
              onChange={(event) =>
                setForm((current) => ({ ...current, title: event.target.value }))
              }
              placeholder="Mathematics"
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
        <div className="mt-4">
          <Field id="description" label="Description">
            <input
              id="description"
              maxLength={2000}
              value={form.description}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
              placeholder="Optional"
              className={inputClass}
            />
          </Field>
        </div>
        {item && readOnly ? (
          <p className="mt-4 text-sm text-muted">
            Assigned to {item.classCourseCount} class
            {item.classCourseCount === 1 ? "" : "es"}.
          </p>
        ) : null}
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
