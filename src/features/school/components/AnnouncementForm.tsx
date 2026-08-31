"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { FilterSelect } from "@/components/dashboard/FilterSelect";
import { getApiErrorMessage } from "@/lib/getApiErrorMessage";
import { useCreateDashboardAnnouncementMutation } from "@/features/school/api/announcementsApi";
import { useGetClassesQuery } from "@/features/school/api/classesApi";
import { useGetSectionsQuery } from "@/features/school/api/sectionsApi";
import { useSchoolYearFilter } from "@/features/school/useSchoolYearFilter";
import { selectAuthReady, selectAccessToken } from "@/features/auth/authSlice";
import { useAppSelector } from "@/store/hooks";
import type {
  AnnouncementAudienceTarget,
  SaveAnnouncementBody,
} from "@/features/school/types";

const inputClass =
  "h-11 w-full rounded-xl border border-border bg-white px-3 text-sm text-foreground outline-none transition-colors duration-200 placeholder:text-muted/80 focus:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

const audienceOptions: Array<{
  value: AnnouncementAudienceTarget;
  label: string;
}> = [
  { value: "parent", label: "Parents" },
  { value: "student", label: "Students" },
  { value: "teacher", label: "Teachers" },
];

type AnnouncementFormState = {
  title: string;
  content: string;
  audienceTargets: AnnouncementAudienceTarget[];
  classId: number;
  sectionId: number;
};

function emptyForm(): AnnouncementFormState {
  return {
    title: "",
    content: "",
    audienceTargets: ["parent"],
    classId: 0,
    sectionId: 0,
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

export function AnnouncementForm() {
  const router = useRouter();
  const ready = useAppSelector(selectAuthReady);
  const accessToken = useAppSelector(selectAccessToken);
  const canFetch = ready && Boolean(accessToken);
  const [form, setForm] = useState<AnnouncementFormState>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const { yearId: defaultYearId } = useSchoolYearFilter(canFetch);
  const [createAnnouncement, createState] =
    useCreateDashboardAnnouncementMutation();

  const { data: classesData } = useGetClassesQuery(
    { page: 1, limit: 100, sortOrder: "asc" },
    { skip: !canFetch },
  );
  const classes = classesData?.items ?? [];

  const classSelected = form.classId > 0;

  const { data: sectionsData, isFetching: sectionsLoading } = useGetSectionsQuery(
    {
      page: 1,
      limit: 100,
      yearId: defaultYearId ?? undefined,
      classId: form.classId,
      sortBy: "section",
      sortOrder: "asc",
    },
    { skip: !canFetch || !defaultYearId || !classSelected },
  );
  const sections = sectionsData?.items ?? [];

  function toggleAudience(target: AnnouncementAudienceTarget) {
    setForm((current) => {
      const selected = current.audienceTargets.includes(target);
      if (selected) {
        const next = current.audienceTargets.filter((item) => item !== target);
        return {
          ...current,
          audienceTargets: next.length > 0 ? next : current.audienceTargets,
        };
      }
      return {
        ...current,
        audienceTargets: [...current.audienceTargets, target],
      };
    });
  }

  async function onSave() {
    setFormError(null);
    const content = form.content.trim();
    if (!content) {
      setFormError("Content is required");
      return;
    }
    if (classSelected && !form.sectionId) {
      setFormError("Select a section for this class");
      return;
    }
    if (form.audienceTargets.length === 0) {
      setFormError("Select at least one audience");
      return;
    }

    const body: SaveAnnouncementBody = {
      title: form.title.trim() || undefined,
      content,
      audienceTargets: form.audienceTargets,
      ...(form.sectionId ? { sectionId: form.sectionId } : {}),
    };

    try {
      await createAnnouncement(body).unwrap();
      router.push("/announcements");
    } catch (error) {
      setFormError(getApiErrorMessage(error, "Could not create announcement"));
    }
  }

  const sectionOptions = classSelected
    ? sections.map((section) => ({
        value: section.id,
        label: section.sectionTitle,
      }))
    : [{ value: 0, label: "All school" }];

  return (
    <form
      className="rounded-3xl border border-border bg-white p-6 shadow-sm sm:p-8"
      onSubmit={(event) => {
        event.preventDefault();
        void onSave();
      }}
    >
      <h1 className="mb-8 text-center text-3xl font-semibold tracking-tight text-foreground">
        Add Announcement
      </h1>

      <div className="mx-auto flex max-w-2xl flex-col gap-5">
        <Field id="announcement-title" label="Title">
          <input
            id="announcement-title"
            type="text"
            value={form.title}
            onChange={(event) =>
              setForm((current) => ({ ...current, title: event.target.value }))
            }
            placeholder="School holiday"
            className={inputClass}
          />
        </Field>

        <Field id="announcement-content" label="Content" required>
          <textarea
            id="announcement-content"
            value={form.content}
            onChange={(event) =>
              setForm((current) => ({ ...current, content: event.target.value }))
            }
            placeholder="Write the announcement message…"
            rows={6}
            className={`${inputClass} min-h-[9rem] resize-y py-3`}
          />
        </Field>

        <Field id="announcement-audience" label="Audience" required>
          <div
            id="announcement-audience"
            className="flex flex-wrap gap-3"
            role="group"
            aria-label="Audience"
          >
            {audienceOptions.map((option) => {
              const checked = form.audienceTargets.includes(option.value);
              return (
                <label
                  key={option.value}
                  className={`inline-flex min-h-11 cursor-pointer items-center gap-2.5 rounded-xl border px-4 text-sm transition-colors duration-200 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring ${
                    checked
                      ? "border-primary bg-primary-soft font-medium text-primary"
                      : "border-border bg-white text-foreground hover:border-primary/40 hover:bg-primary-soft/60"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleAudience(option.value)}
                    className="peer sr-only"
                  />
                  <span
                    aria-hidden
                    className={`inline-flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors duration-200 ${
                      checked
                        ? "border-primary bg-primary text-on-primary"
                        : "border-border bg-white"
                    }`}
                  >
                    {checked ? <Check className="h-3 w-3 stroke-[3]" /> : null}
                  </span>
                  {option.label}
                </label>
              );
            })}
          </div>
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field id="announcement-class" label="Class">
            <FilterSelect
              label="Class"
              value={form.classId}
              options={[
                { value: 0, label: "All school" },
                ...classes.map((itemClass) => ({
                  value: itemClass.id,
                  label: itemClass.className,
                })),
              ]}
              onChange={(classId) =>
                setForm((current) => ({
                  ...current,
                  classId,
                  sectionId: 0,
                }))
              }
            />
          </Field>

          <Field id="announcement-section" label="Section">
            <FilterSelect
              label="Section"
              value={form.sectionId}
              disabled={!classSelected}
              options={
                !classSelected
                  ? [{ value: 0, label: "All school" }]
                  : sectionsLoading
                    ? [{ value: 0, label: "Loading sections…" }]
                    : sectionOptions.length > 0
                      ? sectionOptions
                      : [{ value: 0, label: "No sections for this class" }]
              }
              onChange={(sectionId) =>
                setForm((current) => ({ ...current, sectionId }))
              }
            />
          </Field>
        </div>

        {formError ? (
          <p className="text-sm text-red-600" role="alert">
            {formError}
          </p>
        ) : null}

        <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => router.push("/announcements")}
            className="inline-flex h-11 cursor-pointer items-center justify-center rounded-xl border border-border px-5 text-sm font-medium hover:bg-primary-soft"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={createState.isLoading}
            className="inline-flex h-11 cursor-pointer items-center justify-center rounded-xl bg-primary px-5 text-sm font-medium text-on-primary hover:bg-primary-hover disabled:opacity-50"
          >
            {createState.isLoading ? "Saving…" : "Create announcement"}
          </button>
        </div>
      </div>
    </form>
  );
}
