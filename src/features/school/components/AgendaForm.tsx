"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { YearFilterSelect } from "@/components/dashboard/YearFilterSelect";
import { getApiErrorMessage } from "@/lib/getApiErrorMessage";
import { selectAuthReady, selectAccessToken } from "@/features/auth/authSlice";
import {
  useCreateDashboardAgendaMutation,
  useGetDashboardAgendaQuery,
  useUpdateDashboardAgendaMutation,
} from "@/features/school/api/agendasApi";
import { useGetClassesQuery } from "@/features/school/api/classesApi";
import { useGetClassCoursesQuery } from "@/features/school/api/coursesApi";
import { useGetSectionsQuery } from "@/features/school/api/sectionsApi";
import { useSchoolYearFilter } from "@/features/school/useSchoolYearFilter";
import { useAppSelector } from "@/store/hooks";
import type { SaveAgendaBody } from "@/features/school/types";

const inputClass =
  "h-11 w-full rounded-xl border border-border bg-white px-3 text-sm text-foreground outline-none transition-colors duration-200 placeholder:text-muted/80 focus:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

type FormState = {
  description: string;
  agendaDate: string;
  time: string;
  courseId: number;
  yearId: number;
  classId: number;
  sectionIds: number[];
  imageLink: string;
  fileLink: string;
  status: string;
};

function emptyForm(): FormState {
  return {
    description: "",
    agendaDate: "",
    time: "",
    courseId: 0,
    yearId: 0,
    classId: 0,
    sectionIds: [],
    imageLink: "",
    fileLink: "",
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

export function AgendaForm({
  agendaId,
  readOnly = false,
}: {
  agendaId?: number;
  readOnly?: boolean;
}) {
  const router = useRouter();
  const ready = useAppSelector(selectAuthReady);
  const accessToken = useAppSelector(selectAccessToken);
  const canFetch = ready && Boolean(accessToken);
  const isEdit = Boolean(agendaId) && !readOnly;
  const [form, setForm] = useState<FormState>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const { years, yearId: defaultYearId } = useSchoolYearFilter(canFetch);

  const { data: item, isLoading } = useGetDashboardAgendaQuery(agendaId ?? 0, {
    skip: !canFetch || !agendaId,
  });
  const [createAgenda, createState] = useCreateDashboardAgendaMutation();
  const [updateAgenda, updateState] = useUpdateDashboardAgendaMutation();
  const saving = createState.isLoading || updateState.isLoading;

  const { data: classesData } = useGetClassesQuery(
    { page: 1, limit: 100, sortOrder: "asc" },
    { skip: !canFetch },
  );

  const yearId = form.yearId || defaultYearId || 0;
  const classSelected = form.classId > 0;
  const { data: classCoursesData } = useGetClassCoursesQuery(
    {
      page: 1,
      limit: 100,
      classId: form.classId,
      yearId: yearId || undefined,
      status: "active",
      sortBy: "course",
      sortOrder: "asc",
    },
    { skip: !canFetch || !yearId || !classSelected },
  );
  const { data: sectionsData } = useGetSectionsQuery(
    {
      page: 1,
      limit: 100,
      yearId: yearId || undefined,
      classId: form.classId,
      sortBy: "section",
      sortOrder: "asc",
    },
    { skip: !canFetch || !yearId || !classSelected },
  );

  const classes = classesData?.items ?? [];
  const courses = classCoursesData?.items ?? [];
  const sections = sectionsData?.items ?? [];

  useEffect(() => {
    if (!item) {
      return;
    }
    const firstSection = item.sections[0];
    setForm({
      description: item.description,
      agendaDate: item.agendaDate,
      time: item.time,
      courseId: item.courseId,
      yearId: firstSection?.yearId ?? 0,
      classId: firstSection?.classId ?? 0,
      sectionIds: item.sections.map((section) => section.sectionId),
      imageLink: item.imageLink,
      fileLink: item.fileLink,
      status: String(item.status),
    });
  }, [item]);

  useEffect(() => {
    if (form.yearId || !defaultYearId) {
      return;
    }
    setForm((current) => ({ ...current, yearId: defaultYearId }));
  }, [defaultYearId, form.yearId]);

  function toggleSection(sectionId: number) {
    setForm((current) => {
      const selected = current.sectionIds.includes(sectionId);
      return {
        ...current,
        sectionIds: selected
          ? current.sectionIds.filter((id) => id !== sectionId)
          : [...current.sectionIds, sectionId],
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
    if (!form.agendaDate) {
      setFormError("Date is required");
      return;
    }
    if (!form.time.trim()) {
      setFormError("Time is required");
      return;
    }
    if (!form.classId) {
      setFormError("Class is required");
      return;
    }
    if (!form.courseId) {
      setFormError("Course is required");
      return;
    }
    if (form.sectionIds.length === 0) {
      setFormError("Select at least one section");
      return;
    }

    const body: SaveAgendaBody = {
      description,
      agendaDate: form.agendaDate,
      time: form.time.trim(),
      courseId: form.courseId,
      sectionIds: form.sectionIds,
      imageLink: form.imageLink.trim() || undefined,
      fileLink: form.fileLink.trim() || undefined,
      status: form.status === "0" ? 0 : 1,
    };

    try {
      if (isEdit && agendaId) {
        await updateAgenda({ id: agendaId, body }).unwrap();
      } else {
        await createAgenda(body).unwrap();
      }
      router.push("/agenda?saved=1");
    } catch (caught) {
      setFormError(getApiErrorMessage(caught, "Could not save agenda"));
    }
  }

  if (agendaId && isLoading) {
    return <p className="text-sm text-muted">Loading agenda…</p>;
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
          {readOnly ? "Agenda" : isEdit ? "Edit agenda" : "Add agenda"}
        </h1>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="agenda-date" label="Date" required>
            <input
              id="agenda-date"
              type="date"
              required
              value={form.agendaDate}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  agendaDate: event.target.value,
                }))
              }
              className={inputClass}
            />
          </Field>
          <Field id="agenda-time" label="Time" required>
            <input
              id="agenda-time"
              type="time"
              required
              value={form.time}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  time: event.target.value,
                }))
              }
              className={inputClass}
            />
          </Field>
          <Field id="agenda-class" label="Class" required>
            <select
              id="agenda-class"
              required
              value={form.classId}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  classId: Number(event.target.value),
                  courseId: 0,
                  sectionIds: [],
                }))
              }
              className={`${inputClass} cursor-pointer`}
            >
              <option value={0}>Select class</option>
              {classes.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.className}
                </option>
              ))}
            </select>
          </Field>
          <Field id="agenda-course" label="Course" required>
            <select
              id="agenda-course"
              required
              disabled={!classSelected}
              value={form.courseId}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  courseId: Number(event.target.value),
                }))
              }
              className={`${inputClass} cursor-pointer disabled:cursor-not-allowed disabled:opacity-50`}
            >
              <option value={0}>
                {classSelected ? "Select course" : "Select a class first"}
              </option>
              {courses.map((course) => (
                <option key={course.courseId} value={course.courseId}>
                  {course.courseTitle}
                </option>
              ))}
            </select>
          </Field>
          <Field id="agenda-status" label="Status">
            <select
              id="agenda-status"
              value={form.status}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  status: event.target.value,
                }))
              }
              className={`${inputClass} cursor-pointer`}
            >
              <option value="1">Active</option>
              <option value="0">Inactive</option>
            </select>
          </Field>
          <div className="sm:col-span-2">
            <p className="mb-1.5 text-sm font-medium text-foreground">
              Sections *
            </p>
            <div className="mb-2">
              <YearFilterSelect
                years={years}
                value={yearId || null}
                onChange={(nextYearId) =>
                  setForm((current) => ({
                    ...current,
                    yearId: nextYearId,
                    courseId: 0,
                    sectionIds: [],
                  }))
                }
              />
            </div>
            <div
              className="flex flex-col gap-2 rounded-xl border border-border bg-white p-3"
              role="group"
              aria-label="Sections"
            >
              {!classSelected ? (
                <p className="px-1 py-2 text-sm text-muted">
                  Select a class to see its sections.
                </p>
              ) : sections.length === 0 ? (
                <p className="px-1 py-2 text-sm text-muted">
                  No sections for this class.
                </p>
              ) : (
                <>
                  <label className="inline-flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-2 text-sm font-medium text-foreground hover:bg-primary-soft">
                    <input
                      type="checkbox"
                      checked={
                        sections.length > 0 &&
                        sections.every((section) =>
                          form.sectionIds.includes(section.id),
                        )
                      }
                      onChange={() => {
                        const allSelected = sections.every((section) =>
                          form.sectionIds.includes(section.id),
                        );
                        setForm((current) => ({
                          ...current,
                          sectionIds: allSelected
                            ? []
                            : sections.map((section) => section.id),
                        }));
                      }}
                      className="h-4 w-4 shrink-0 cursor-pointer accent-primary"
                    />
                    Select all
                  </label>
                  {sections.map((section) => (
                    <label
                      key={section.id}
                      className="inline-flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-2 text-sm text-foreground hover:bg-primary-soft"
                    >
                      <input
                        type="checkbox"
                        checked={form.sectionIds.includes(section.id)}
                        onChange={() => toggleSection(section.id)}
                        className="h-4 w-4 shrink-0 cursor-pointer accent-primary"
                      />
                      {section.sectionTitle}
                    </label>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>

        <div className="mt-4">
          <Field id="agenda-description" label="Description" required>
            <textarea
              id="agenda-description"
              required
              value={form.description}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
              placeholder="Homework or class work for this day"
              rows={5}
              className={`${inputClass} min-h-[8rem] resize-y py-3`}
            />
          </Field>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field id="agenda-image" label="Image link">
            <input
              id="agenda-image"
              type="text"
              value={form.imageLink}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  imageLink: event.target.value,
                }))
              }
              placeholder="https://"
              className={inputClass}
            />
          </Field>
          <Field id="agenda-file" label="File link">
            <input
              id="agenda-file"
              type="text"
              value={form.fileLink}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  fileLink: event.target.value,
                }))
              }
              placeholder="https://"
              className={inputClass}
            />
          </Field>
        </div>

        {formError ? (
          <p className="mt-4 text-sm text-red-600" role="alert">
            {formError}
          </p>
        ) : null}
        {!readOnly ? (
          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => router.push("/agenda")}
              className="inline-flex h-11 cursor-pointer items-center justify-center rounded-xl border border-border bg-white px-5 text-sm font-medium text-foreground hover:bg-stone-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex h-11 cursor-pointer items-center justify-center rounded-xl bg-primary px-5 text-sm font-medium text-on-primary hover:bg-primary-hover disabled:opacity-50"
            >
              {saving ? "Saving…" : isEdit ? "Save changes" : "Save"}
            </button>
          </div>
        ) : null}
      </fieldset>
    </form>
  );
}
