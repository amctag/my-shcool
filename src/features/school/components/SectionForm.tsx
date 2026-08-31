"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { getApiErrorMessage } from "@/lib/getApiErrorMessage";
import { selectAuthReady } from "@/features/auth/authSlice";
import { useGetClassesQuery } from "@/features/school/api/classesApi";
import {
  useCreateSectionMutation,
  useGetSectionQuery,
  useGetSectionTitlesQuery,
  useGetYearsQuery,
  useUpdateSectionMutation,
} from "@/features/school/api/sectionsApi";
import { useAppSelector } from "@/store/hooks";
import type { SaveSectionBody } from "@/features/school/types";

const inputClass =
  "h-11 w-full rounded-xl border border-border bg-white px-3 text-sm text-foreground outline-none transition-colors duration-200 placeholder:text-muted/80 focus:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

type SectionFormState = {
  classId: string;
  sectionTitleId: string;
  yearId: string;
  status: string;
};

function emptyForm(): SectionFormState {
  return {
    classId: "",
    sectionTitleId: "",
    yearId: "",
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

export function SectionForm({
  sectionId,
  readOnly = false,
}: {
  sectionId?: number;
  readOnly?: boolean;
}) {
  const router = useRouter();
  const authReady = useAppSelector(selectAuthReady);
  const isEdit = Boolean(sectionId) && !readOnly;
  const [form, setForm] = useState<SectionFormState>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);

  const { data: section, isLoading: sectionLoading } = useGetSectionQuery(
    sectionId ?? 0,
    { skip: !authReady || !sectionId },
  );
  const { data: classesData } = useGetClassesQuery(
    { page: 1, limit: 100 },
    { skip: !authReady },
  );
  const { data: titles = [] } = useGetSectionTitlesQuery(undefined, {
    skip: !authReady,
  });
  const { data: years = [] } = useGetYearsQuery(undefined, {
    skip: !authReady,
  });
  const [createSection, createState] = useCreateSectionMutation();
  const [updateSection, updateState] = useUpdateSectionMutation();
  const saving = createState.isLoading || updateState.isLoading;
  const classes = classesData?.items ?? [];
  const titleOptions = useMemo(
    () =>
      titles.filter(
        (item) =>
          item.status === 1 || String(item.id) === form.sectionTitleId,
      ),
    [form.sectionTitleId, titles],
  );

  useEffect(() => {
    if (sectionId || form.yearId) {
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
  }, [form.yearId, sectionId, years]);

  useEffect(() => {
    if (!section) {
      return;
    }
    setForm({
      classId: String(section.classId),
      sectionTitleId: String(section.sectionTitleId),
      yearId: String(section.yearId),
      status: String(section.status),
    });
  }, [section]);

  async function onSave() {
    setFormError(null);
    const classId = Number(form.classId);
    const sectionTitleId = Number(form.sectionTitleId);
    const yearId = Number(form.yearId);
    if (!classId || !sectionTitleId || !yearId) {
      setFormError("Class, section title, and year are required");
      return;
    }

    const body: SaveSectionBody = {
      classId,
      sectionTitleId,
      yearId,
      status: form.status === "0" ? 0 : 1,
    };

    try {
      if (sectionId) {
        await updateSection({ id: sectionId, body }).unwrap();
      } else {
        await createSection(body).unwrap();
      }
      router.push("/sections");
    } catch (error) {
      setFormError(getApiErrorMessage(error, "Could not save section"));
    }
  }

  if (sectionId && sectionLoading) {
    return (
      <p className="rounded-3xl border border-border bg-white p-8 text-sm text-muted">
        Loading section…
      </p>
    );
  }

  return (
    <form
      className="rounded-3xl border border-border bg-white p-6 shadow-sm sm:p-8"
      onSubmit={(event) => {
        event.preventDefault();
        if (!readOnly) {
          void onSave();
        }
      }}
    >
      <h1 className="mb-8 text-center text-3xl font-semibold tracking-tight text-foreground">
        {readOnly ? "View Section" : isEdit ? "Edit Section" : "Add New Section"}
      </h1>

      <fieldset
        disabled={readOnly}
        className="min-w-0 border-0 p-0 disabled:[&_select]:bg-stone-50 disabled:[&_select]:text-muted"
      >
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
              {classes.map((item) => (
                <option key={item.id} value={String(item.id)}>
                  {item.className} ({item.stageTitle})
                </option>
              ))}
            </select>
          </Field>
          <Field id="sectionTitleId" label="Section" required>
            <select
              id="sectionTitleId"
              required
              value={form.sectionTitleId}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  sectionTitleId: event.target.value,
                }))
              }
              className={`${inputClass} cursor-pointer`}
            >
              <option value="">Choose section title</option>
              {titleOptions.map((item) => (
                <option key={item.id} value={String(item.id)}>
                  {item.title}
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
              {years.map((item) => (
                <option key={item.id} value={String(item.id)}>
                  {item.title}
                  {item.isCurrent ? " (current)" : ""}
                </option>
              ))}
            </select>
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
              className="h-11 cursor-pointer rounded-xl bg-primary px-5 text-sm font-medium text-on-primary transition-colors duration-200 hover:bg-primary-hover"
            >
              Reset
            </button>
            <button
              type="submit"
              disabled={saving}
              className="h-11 cursor-pointer rounded-xl bg-foreground px-5 text-sm font-medium text-white transition-colors duration-200 hover:opacity-90 disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        )}
      </fieldset>
    </form>
  );
}
