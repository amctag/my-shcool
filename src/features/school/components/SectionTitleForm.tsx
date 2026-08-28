"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { getApiErrorMessage } from "@/lib/getApiErrorMessage";
import { selectAuthReady } from "@/features/auth/authSlice";
import {
  useCreateSectionTitleMutation,
  useGetSectionTitleQuery,
  useUpdateSectionTitleMutation,
} from "@/features/school/api/sectionsApi";
import { useAppSelector } from "@/store/hooks";

const inputClass =
  "h-11 w-full rounded-xl border border-border bg-white px-3 text-sm text-foreground outline-none transition-colors duration-200 placeholder:text-muted/80 focus:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

type FormState = {
  title: string;
  status: string;
};

function emptyForm(): FormState {
  return { title: "", status: "1" };
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

export function SectionTitleForm({
  titleId,
  readOnly = false,
}: {
  titleId?: number;
  readOnly?: boolean;
}) {
  const router = useRouter();
  const authReady = useAppSelector(selectAuthReady);
  const isEdit = Boolean(titleId) && !readOnly;
  const [form, setForm] = useState<FormState>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);

  const { data: item, isLoading } = useGetSectionTitleQuery(titleId ?? 0, {
    skip: !authReady || !titleId,
  });
  const [createTitle, createState] = useCreateSectionTitleMutation();
  const [updateTitle, updateState] = useUpdateSectionTitleMutation();
  const saving = createState.isLoading || updateState.isLoading;

  useEffect(() => {
    if (!item) {
      return;
    }
    setForm({
      title: item.title,
      status: String(item.status),
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
      status: Number(form.status),
    };

    try {
      if (isEdit && titleId) {
        await updateTitle({ id: titleId, body }).unwrap();
      } else {
        await createTitle(body).unwrap();
      }
      router.push("/section-titles");
    } catch (caught) {
      setFormError(getApiErrorMessage(caught, "Could not save section title"));
    }
  }

  if (titleId && isLoading) {
    return <p className="text-sm text-muted">Loading section title…</p>;
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
          {readOnly ? "Section title" : isEdit ? "Edit section title" : "Add section title"}
        </h1>
        <p className="mb-6 text-sm text-muted">
          Titles are shared across all classes. Add A–F once, then pick them when
          you create a class section.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="title" label="Title" required>
            <input
              id="title"
              required
              maxLength={100}
              value={form.title}
              onChange={(event) =>
                setForm((current) => ({ ...current, title: event.target.value }))
              }
              placeholder="A"
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
        {item && readOnly ? (
          <p className="mt-4 text-sm text-muted">
            Used by {item.sectionCount} class section
            {item.sectionCount === 1 ? "" : "s"}.
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
