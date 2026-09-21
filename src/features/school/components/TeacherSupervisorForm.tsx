"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { getApiErrorMessage } from "@/lib/getApiErrorMessage";
import { selectAuthReady } from "@/features/auth/authSlice";
import { useGetClassesQuery } from "@/features/school/api/classesApi";
import { useGetYearsQuery } from "@/features/school/api/sectionsApi";
import { useGetTeachersQuery } from "@/features/school/api/teachersApi";
import {
  useCreateTeacherSupervisorMutation,
  useDeleteTeacherSupervisorMutation,
  useGetTeacherSupervisorQuery,
  useGetTeacherSupervisorsQuery,
} from "@/features/school/api/teacherSupervisorsApi";
import { useAppSelector } from "@/store/hooks";

const inputClass =
  "h-11 w-full rounded-xl border border-border bg-white px-3 text-sm text-foreground outline-none transition-colors duration-200 placeholder:text-muted/80 focus:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

type FormState = {
  yearId: string;
  classIds: number[];
  teacherId: string;
};

function emptyForm(): FormState {
  return {
    yearId: "",
    classIds: [],
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

export function TeacherSupervisorForm({
  supervisorId,
  readOnly = false,
}: {
  supervisorId?: number;
  readOnly?: boolean;
}) {
  const router = useRouter();
  const authReady = useAppSelector(selectAuthReady);
  const isEdit = Boolean(supervisorId) && !readOnly;
  const [form, setForm] = useState<FormState>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(!supervisorId);

  const yearId = Number(form.yearId) || 0;
  const teacherId = Number(form.teacherId) || 0;

  const { data: item, isLoading } = useGetTeacherSupervisorQuery(
    supervisorId ?? 0,
    { skip: !authReady || !supervisorId },
  );
  const { data: classesData } = useGetClassesQuery(
    { page: 1, limit: 100 },
    { skip: !authReady },
  );
  const { data: years = [] } = useGetYearsQuery(undefined, {
    skip: !authReady,
  });
  const { data: teachersData } = useGetTeachersQuery(
    { page: 1, limit: 100, sortBy: "name", sortOrder: "asc" },
    { skip: !authReady },
  );
  const editTeacherId = item?.teacherId ?? teacherId;
  const editYearId = item?.yearId ?? yearId;
  const { data: assignmentGroups } = useGetTeacherSupervisorsQuery(
    {
      page: 1,
      limit: 20,
      teacherId: editTeacherId,
      yearId: editYearId,
      sortBy: "id",
      sortOrder: "asc",
    },
    { skip: !authReady || !editTeacherId || !editYearId },
  );
  const [createSupervisor, createState] = useCreateTeacherSupervisorMutation();
  const [deleteSupervisor, deleteState] = useDeleteTeacherSupervisorMutation();
  const saving = createState.isLoading || deleteState.isLoading;
  const teachers = teachersData?.items ?? [];
  const classes = classesData?.items ?? [];

  const currentGroup = assignmentGroups?.items?.[0];
  const existingByClassId = useMemo(() => {
    const map = new Map<number, number>();
    for (const cls of currentGroup?.classes ?? []) {
      map.set(cls.classId, cls.id);
    }
    return map;
  }, [currentGroup?.classes]);

  useEffect(() => {
    if (supervisorId || form.yearId) {
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
  }, [form.yearId, supervisorId, years]);

  useEffect(() => {
    if (!item || !currentGroup || hydrated) {
      return;
    }
    setForm({
      yearId: String(item.yearId),
      classIds: currentGroup.classes.map((cls) => cls.classId),
      teacherId: String(item.teacherId),
    });
    setHydrated(true);
  }, [item, currentGroup, hydrated]);

  function toggleClass(classId: number) {
    setForm((current) => {
      const selected = current.classIds.includes(classId)
        ? current.classIds.filter((id) => id !== classId)
        : [...current.classIds, classId];
      return { ...current, classIds: selected };
    });
  }

  async function onSave() {
    setFormError(null);
    const selectedTeacherId = Number(form.teacherId);
    const selectedYearId = Number(form.yearId);
    if (!selectedTeacherId || !selectedYearId) {
      setFormError("Teacher and year are required");
      return;
    }
    if (form.classIds.length === 0) {
      setFormError("Select at least one class");
      return;
    }

    try {
      if (supervisorId) {
        const selected = new Set(form.classIds);
        const toRemove = [...existingByClassId.entries()].filter(
          ([classId]) => !selected.has(classId),
        );
        const toAdd = form.classIds.filter(
          (classId) => !existingByClassId.has(classId),
        );
        for (const [, id] of toRemove) {
          await deleteSupervisor(id).unwrap();
        }
        if (toAdd.length > 0) {
          await createSupervisor({
            teacherId: selectedTeacherId,
            classIds: toAdd,
            yearId: selectedYearId,
          }).unwrap();
        }
      } else {
        const classIds = form.classIds.filter(
          (classId) => !existingByClassId.has(classId),
        );
        if (classIds.length === 0) {
          setFormError("This teacher already supervises the selected classes");
          return;
        }
        await createSupervisor({
          teacherId: selectedTeacherId,
          classIds,
          yearId: selectedYearId,
        }).unwrap();
      }
      router.push("/teacher-supervisors");
    } catch (caught) {
      setFormError(getApiErrorMessage(caught, "Could not save supervisor"));
    }
  }

  if (supervisorId && (isLoading || !hydrated)) {
    return <p className="text-sm text-muted">Loading supervisor…</p>;
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
          ? "View supervisor"
          : isEdit
            ? "Edit supervisor"
            : "Add supervisor"}
      </h1>
      <fieldset disabled={readOnly} className="min-w-0 border-0 p-0">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="yearId" label="Year" required>
            <select
              id="yearId"
              required
              disabled={Boolean(supervisorId)}
              value={form.yearId}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  yearId: event.target.value,
                  classIds: [],
                }))
              }
              className={`${inputClass} cursor-pointer disabled:bg-stone-50`}
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
          <Field id="teacherId" label="Teacher" required>
            <select
              id="teacherId"
              required
              disabled={Boolean(supervisorId)}
              value={form.teacherId}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  teacherId: event.target.value,
                  classIds: [],
                }))
              }
              className={`${inputClass} cursor-pointer disabled:bg-stone-50`}
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

        <div className="mt-6">
          <p className="mb-1.5 text-sm font-medium text-foreground">
            Classes *
          </p>
          <p className="mb-3 text-sm text-muted">
            Select every class this teacher should supervise. All sections of
            each class are included.
          </p>
          {classes.length === 0 ? (
            <p className="text-sm text-muted">No classes found.</p>
          ) : (
            <div className="flex flex-wrap gap-3">
              {classes.map((itemClass) => {
                const alreadyAssigned =
                  !supervisorId && existingByClassId.has(itemClass.id);
                const checked =
                  alreadyAssigned || form.classIds.includes(itemClass.id);
                const disabled = alreadyAssigned;
                return (
                  <label
                    key={itemClass.id}
                    className={`inline-flex min-h-11 items-center gap-2.5 rounded-xl border px-4 text-sm transition-colors duration-200 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring ${
                      disabled
                        ? "cursor-not-allowed border-border bg-stone-50 text-muted"
                        : checked
                          ? "cursor-pointer border-primary bg-primary-soft font-medium text-primary"
                          : "cursor-pointer border-border bg-white text-foreground hover:border-primary/40 hover:bg-primary-soft/60"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={disabled || readOnly}
                      onChange={() => toggleClass(itemClass.id)}
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
                      {checked ? (
                        <Check className="h-3 w-3 stroke-[3]" />
                      ) : null}
                    </span>
                    {alreadyAssigned
                      ? `${itemClass.className} (already assigned)`
                      : `${itemClass.className} (${itemClass.stageTitle})`}
                  </label>
                );
              })}
            </div>
          )}
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
