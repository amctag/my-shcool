"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { FilterSelect } from "@/components/dashboard/FilterSelect";
import { YearFilterSelect } from "@/components/dashboard/YearFilterSelect";
import { getApiErrorMessage } from "@/lib/getApiErrorMessage";
import { selectAuthReady, selectAccessToken } from "@/features/auth/authSlice";
import {
  useCreateAgendaSectionMutation,
  useGetAgendaSectionQuery,
  useUpdateAgendaSectionMutation,
} from "@/features/school/api/agendaSectionsApi";
import { useGetDashboardAgendasQuery } from "@/features/school/api/agendasApi";
import { useGetClassesQuery } from "@/features/school/api/classesApi";
import { useGetSectionsQuery } from "@/features/school/api/sectionsApi";
import { useSchoolYearFilter } from "@/features/school/useSchoolYearFilter";
import { useAppSelector } from "@/store/hooks";
import type { SaveAgendaSectionBody } from "@/features/school/types";

const inputClass =
  "h-11 w-full rounded-xl border border-border bg-white px-3 text-sm text-foreground outline-none transition-colors duration-200 placeholder:text-muted/80 focus:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

type FormState = {
  agendaId: number;
  yearId: number;
  classId: number;
  sectionId: number;
};

function emptyForm(): FormState {
  return { agendaId: 0, yearId: 0, classId: 0, sectionId: 0 };
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

export function AgendaSectionForm({
  assignmentId,
  readOnly = false,
}: {
  assignmentId?: number;
  readOnly?: boolean;
}) {
  const router = useRouter();
  const ready = useAppSelector(selectAuthReady);
  const accessToken = useAppSelector(selectAccessToken);
  const canFetch = ready && Boolean(accessToken);
  const isEdit = Boolean(assignmentId) && !readOnly;
  const [form, setForm] = useState<FormState>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const { years, yearId: defaultYearId } = useSchoolYearFilter(canFetch);

  const { data: item, isLoading } = useGetAgendaSectionQuery(
    assignmentId ?? 0,
    { skip: !canFetch || !assignmentId },
  );
  const [createAssignment, createState] = useCreateAgendaSectionMutation();
  const [updateAssignment, updateState] = useUpdateAgendaSectionMutation();
  const saving = createState.isLoading || updateState.isLoading;

  const { data: agendasData } = useGetDashboardAgendasQuery(
    { page: 1, limit: 100, sortBy: "agendaDate", sortOrder: "desc" },
    { skip: !canFetch },
  );
  const { data: classesData } = useGetClassesQuery(
    { page: 1, limit: 100, sortOrder: "asc" },
    { skip: !canFetch },
  );

  const yearId = form.yearId || defaultYearId || 0;
  const { data: sectionsData } = useGetSectionsQuery(
    {
      page: 1,
      limit: 100,
      yearId: yearId || undefined,
      classId: form.classId || undefined,
      sortBy: "section",
      sortOrder: "asc",
    },
    { skip: !canFetch || !yearId },
  );

  const agendas = agendasData?.items ?? [];
  const classes = classesData?.items ?? [];
  const sections = sectionsData?.items ?? [];

  useEffect(() => {
    if (!item) {
      return;
    }
    setForm({
      agendaId: item.agendaId,
      yearId: item.yearId,
      classId: item.classId,
      sectionId: item.sectionId,
    });
  }, [item]);

  useEffect(() => {
    if (form.yearId || !defaultYearId) {
      return;
    }
    setForm((current) => ({ ...current, yearId: defaultYearId }));
  }, [defaultYearId, form.yearId]);

  async function onSave() {
    setFormError(null);
    if (!form.agendaId) {
      setFormError("Agenda is required");
      return;
    }
    if (!form.sectionId) {
      setFormError("Section is required");
      return;
    }

    const body: SaveAgendaSectionBody = {
      agendaId: form.agendaId,
      sectionId: form.sectionId,
    };

    try {
      if (isEdit && assignmentId) {
        await updateAssignment({ id: assignmentId, body }).unwrap();
      } else {
        await createAssignment(body).unwrap();
      }
      router.push("/agenda/sections");
    } catch (caught) {
      setFormError(
        getApiErrorMessage(caught, "Could not save agenda section"),
      );
    }
  }

  if (assignmentId && isLoading) {
    return <p className="text-sm text-muted">Loading agenda section…</p>;
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
          {readOnly
            ? "Agenda section"
            : isEdit
              ? "Edit agenda section"
              : "Add agenda section"}
        </h1>
        <p className="mb-6 text-sm text-muted">
          Assign an existing agenda to a class section.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field id="assignment-agenda" label="Agenda" required>
              <select
                id="assignment-agenda"
                required
                value={form.agendaId}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    agendaId: Number(event.target.value),
                  }))
                }
                className={`${inputClass} cursor-pointer`}
              >
                <option value={0}>Select agenda</option>
                {agendas.map((agenda) => (
                  <option key={agenda.id} value={agenda.id}>
                    {agenda.agendaDate} · {agenda.courseTitle} ·{" "}
                    {agenda.description.slice(0, 60)}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <div className="sm:col-span-2">
            <p className="mb-1.5 text-sm font-medium text-foreground">
              Section *
            </p>
            <div className="mb-3 flex flex-wrap gap-2">
              <YearFilterSelect
                years={years}
                value={yearId || null}
                onChange={(nextYearId) =>
                  setForm((current) => ({
                    ...current,
                    yearId: nextYearId,
                    classId: 0,
                    sectionId: 0,
                  }))
                }
              />
              <FilterSelect
                label="Class"
                value={form.classId}
                options={[
                  { value: 0, label: "All classes" },
                  ...classes.map((item) => ({
                    value: item.id,
                    label: item.className,
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
            </div>
            <select
              id="assignment-section"
              required
              value={form.sectionId}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  sectionId: Number(event.target.value),
                }))
              }
              className={`${inputClass} cursor-pointer`}
            >
              <option value={0}>Select section</option>
              {sections.map((section) => (
                <option key={section.id} value={section.id}>
                  {section.className}/{section.sectionTitle}
                </option>
              ))}
            </select>
          </div>
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
              onClick={() => router.push("/agenda/sections")}
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
