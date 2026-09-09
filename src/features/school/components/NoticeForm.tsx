"use client";

import { useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { FilterSelect } from "@/components/dashboard/FilterSelect";
import { getApiErrorMessage } from "@/lib/getApiErrorMessage";
import {
  useCreateDashboardNoticeMutation,
} from "@/features/school/api/noticesApi";
import { useGetNoticeTypesQuery } from "@/features/school/api/noticeTypesApi";
import { useGetClassesQuery } from "@/features/school/api/classesApi";
import { useGetSectionsQuery } from "@/features/school/api/sectionsApi";
import { useGetRegistrationsQuery } from "@/features/school/api/registrationsApi";
import { useSchoolYearFilter } from "@/features/school/useSchoolYearFilter";
import { selectAuthReady, selectAccessToken } from "@/features/auth/authSlice";
import { useAppSelector } from "@/store/hooks";
import type { SaveNoticeBody } from "@/features/school/types";

const inputClass =
  "h-11 w-full rounded-xl border border-border bg-white px-3 text-sm text-foreground outline-none transition-colors duration-200 placeholder:text-muted/80 focus:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

type NoticeFormState = {
  description: string;
  date: string;
  noticeTypeId: number;
  classId: number;
  sectionId: number;
  studentIds: number[];
};

function todayInputValue(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

function emptyForm(): NoticeFormState {
  return {
    description: "",
    date: todayInputValue(),
    noticeTypeId: 0,
    classId: 0,
    sectionId: 0,
    studentIds: [],
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

export function NoticeForm() {
  const router = useRouter();
  const ready = useAppSelector(selectAuthReady);
  const accessToken = useAppSelector(selectAccessToken);
  const canFetch = ready && Boolean(accessToken);
  const [form, setForm] = useState<NoticeFormState>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const { yearId: defaultYearId } = useSchoolYearFilter(canFetch);
  const [createNotice, createState] = useCreateDashboardNoticeMutation();

  const { data: types = [] } = useGetNoticeTypesQuery(undefined, {
    skip: !canFetch,
  });

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
  const sectionSelected = form.sectionId > 0;

  const { data: registrationsData, isFetching: studentsLoading } =
    useGetRegistrationsQuery(
      {
        page: 1,
        limit: 100,
        yearId: defaultYearId ?? undefined,
        classId: form.classId,
        sectionId: form.sectionId,
        sortBy: "student",
        sortOrder: "asc",
      },
      { skip: !canFetch || !defaultYearId || !sectionSelected },
    );
  const registrations = registrationsData?.items ?? [];

  const studentOptions = useMemo(
    () =>
      registrations.map((row) => ({
        id: row.studentId,
        name: row.studentName,
      })),
    [registrations],
  );

  function toggleStudent(studentId: number) {
    setForm((current) => {
      const selected = current.studentIds.includes(studentId);
      return {
        ...current,
        studentIds: selected
          ? current.studentIds.filter((id) => id !== studentId)
          : [...current.studentIds, studentId],
      };
    });
  }

  async function onSave() {
    setFormError(null);
    const description = form.description.trim();
    if (!description) {
      setFormError("Description is required");
      return;
    }
    if (classSelected && !form.sectionId) {
      setFormError("Select a section for this class");
      return;
    }

    const body: SaveNoticeBody = {
      description,
      date: form.date || undefined,
      ...(form.noticeTypeId ? { noticeTypeId: form.noticeTypeId } : {}),
      ...(form.sectionId ? { sectionId: form.sectionId } : {}),
      ...(form.studentIds.length > 0 ? { studentIds: form.studentIds } : {}),
    };

    try {
      await createNotice(body).unwrap();
      router.push("/notices");
    } catch (error) {
      setFormError(getApiErrorMessage(error, "Could not create notice"));
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
        Add Notice
      </h1>

      <div className="mx-auto flex max-w-2xl flex-col gap-5">
        <Field id="notice-description" label="Description" required>
          <textarea
            id="notice-description"
            value={form.description}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                description: event.target.value,
              }))
            }
            placeholder="Write the notice…"
            rows={6}
            className={`${inputClass} min-h-[9rem] resize-y py-3`}
          />
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field id="notice-date" label="Date">
            <input
              id="notice-date"
              type="date"
              value={form.date}
              onChange={(event) =>
                setForm((current) => ({ ...current, date: event.target.value }))
              }
              className={inputClass}
            />
          </Field>

          <Field id="notice-type" label="Type">
            <FilterSelect
              label="Type"
              value={form.noticeTypeId}
              options={[
                { value: 0, label: "No type" },
                ...types.map((type) => ({
                  value: type.id,
                  label: type.title,
                })),
              ]}
              onChange={(noticeTypeId) =>
                setForm((current) => ({ ...current, noticeTypeId }))
              }
            />
          </Field>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field id="notice-class" label="Class">
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
                  studentIds: [],
                }))
              }
            />
          </Field>

          <Field id="notice-section" label="Section">
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
                setForm((current) => ({
                  ...current,
                  sectionId,
                  studentIds: [],
                }))
              }
            />
          </Field>
        </div>

        {sectionSelected ? (
          <div>
            <p className="mb-1.5 text-sm font-medium text-foreground">
              Students
            </p>
            <p className="mb-3 text-sm text-muted">
              Leave unchecked to send to the whole section. Checked students
              get a Firebase notification on their parent app.
            </p>
            {studentsLoading ? (
              <p className="text-sm text-muted">Loading students…</p>
            ) : studentOptions.length === 0 ? (
              <p className="text-sm text-muted">No students in this section.</p>
            ) : (
              <div className="flex flex-wrap gap-3">
                {studentOptions.map((student) => {
                  const checked = form.studentIds.includes(student.id);
                  return (
                    <label
                      key={student.id}
                      className={`inline-flex min-h-11 cursor-pointer items-center gap-2.5 rounded-xl border px-4 text-sm transition-colors duration-200 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring ${
                        checked
                          ? "border-primary bg-primary-soft font-medium text-primary"
                          : "border-border bg-white text-foreground hover:border-primary/40 hover:bg-primary-soft/60"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleStudent(student.id)}
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
                      {student.name}
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        ) : null}

        {formError ? (
          <p className="text-sm text-red-600" role="alert">
            {formError}
          </p>
        ) : null}

        <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => router.push("/notices")}
            className="inline-flex h-11 cursor-pointer items-center justify-center rounded-xl border border-border px-5 text-sm font-medium hover:bg-primary-soft"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={createState.isLoading}
            className="inline-flex h-11 cursor-pointer items-center justify-center rounded-xl bg-primary px-5 text-sm font-medium text-on-primary hover:bg-primary-hover disabled:opacity-50"
          >
            {createState.isLoading ? "Saving…" : "Create notice"}
          </button>
        </div>
      </div>
    </form>
  );
}
