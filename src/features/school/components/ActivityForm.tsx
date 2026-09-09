"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { FilterSelect } from "@/components/dashboard/FilterSelect";
import { getApiErrorMessage } from "@/lib/getApiErrorMessage";
import { useCreateDashboardActivityMutation } from "@/features/school/api/activitiesApi";
import { useSchoolYearFilter } from "@/features/school/useSchoolYearFilter";
import { selectAuthReady, selectAccessToken } from "@/features/auth/authSlice";
import { useAppSelector } from "@/store/hooks";
import type { SaveActivityBody } from "@/features/school/types";

const inputClass =
  "h-11 w-full rounded-xl border border-border bg-white px-3 text-sm text-foreground outline-none transition-colors duration-200 placeholder:text-muted/80 focus:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

type ActivityFormState = {
  title: string;
  content: string;
  date: string;
  image: string;
  yearId: number;
};

function todayInputValue(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

function emptyForm(): ActivityFormState {
  return {
    title: "",
    content: "",
    date: todayInputValue(),
    image: "",
    yearId: 0,
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
    <label htmlFor={id} className="block min-w-0">
      <span className="mb-1.5 block text-sm font-medium text-foreground">
        {label}
        {required ? " *" : ""}
      </span>
      {children}
    </label>
  );
}

export function ActivityForm() {
  const router = useRouter();
  const ready = useAppSelector(selectAuthReady);
  const accessToken = useAppSelector(selectAccessToken);
  const canFetch = ready && Boolean(accessToken);
  const [form, setForm] = useState<ActivityFormState>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const { years, yearId: defaultYearId } = useSchoolYearFilter(canFetch);
  const [createActivity, createState] = useCreateDashboardActivityMutation();

  useEffect(() => {
    if (!defaultYearId) {
      return;
    }
    setForm((current) =>
      current.yearId === 0 ? { ...current, yearId: defaultYearId } : current,
    );
  }, [defaultYearId]);

  async function onSave() {
    setFormError(null);
    const title = form.title.trim();
    const content = form.content.trim();
    if (!title) {
      setFormError("Title is required");
      return;
    }
    if (!content) {
      setFormError("Content is required");
      return;
    }

    const body: SaveActivityBody = {
      title,
      content,
      date: form.date || undefined,
      ...(form.image.trim() ? { image: form.image.trim() } : {}),
      ...(form.yearId > 0 ? { yearId: form.yearId } : {}),
    };

    try {
      await createActivity(body).unwrap();
      router.push("/activities");
    } catch (error) {
      setFormError(getApiErrorMessage(error, "Could not create activity"));
    }
  }

  return (
    <form
      className="rounded-3xl border border-border bg-white p-6 shadow-sm sm:p-8"
      onSubmit={(event) => {
        event.preventDefault();
        void onSave();
      }}
    >
      <h1 className="mb-8 text-center text-3xl font-semibold tracking-tight text-foreground">
        Add Activity
      </h1>

      <div className="mx-auto flex max-w-2xl flex-col gap-5">
        <Field id="activity-title" label="Title" required>
          <input
            id="activity-title"
            type="text"
            value={form.title}
            onChange={(event) =>
              setForm((current) => ({ ...current, title: event.target.value }))
            }
            placeholder="Sports Day"
            className={inputClass}
          />
        </Field>

        <Field id="activity-content" label="Content" required>
          <textarea
            id="activity-content"
            value={form.content}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                content: event.target.value,
              }))
            }
            placeholder="Write the activity details…"
            rows={6}
            className={`${inputClass} min-h-[9rem] resize-y py-3`}
          />
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field id="activity-date" label="Date">
            <input
              id="activity-date"
              type="date"
              value={form.date}
              onChange={(event) =>
                setForm((current) => ({ ...current, date: event.target.value }))
              }
              className={inputClass}
            />
          </Field>

          <Field id="activity-year" label="Year">
            <FilterSelect
              label="Year"
              value={form.yearId}
              options={[
                { value: 0, label: "All school" },
                ...years.map((year) => ({
                  value: year.id,
                  label: year.isCurrent ? `${year.title} (current)` : year.title,
                })),
              ]}
              onChange={(yearId) =>
                setForm((current) => ({ ...current, yearId }))
              }
            />
          </Field>
        </div>

        <Field id="activity-image" label="Image URL">
          <input
            id="activity-image"
            type="url"
            value={form.image}
            onChange={(event) =>
              setForm((current) => ({ ...current, image: event.target.value }))
            }
            placeholder="https://…"
            className={inputClass}
          />
          <span className="mt-1.5 block text-sm text-muted">
            Optional. Parents with the app receive a Firebase notification.
          </span>
        </Field>

        {formError ? (
          <p className="text-sm text-red-600" role="alert">
            {formError}
          </p>
        ) : null}

        <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => router.push("/activities")}
            className="inline-flex h-11 cursor-pointer items-center justify-center rounded-xl border border-border px-5 text-sm font-medium hover:bg-primary-soft"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={createState.isLoading}
            className="inline-flex h-11 cursor-pointer items-center justify-center rounded-xl bg-primary px-5 text-sm font-medium text-on-primary hover:bg-primary-hover disabled:opacity-50"
          >
            {createState.isLoading ? "Saving…" : "Create activity"}
          </button>
        </div>
      </div>
    </form>
  );
}
