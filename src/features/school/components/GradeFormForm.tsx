"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { FilterSelect } from "@/components/dashboard/FilterSelect";
import { LoadingDots } from "@/components/dashboard/TableLoading";
import { YearFilterSelect } from "@/components/dashboard/YearFilterSelect";
import { getApiErrorMessage } from "@/lib/getApiErrorMessage";
import { selectAuthReady } from "@/features/auth/authSlice";
import { useGetClassesQuery } from "@/features/school/api/classesApi";
import {
  useCreateGradeFormMutation,
  useGetGradeFormQuery,
  useUpdateGradeFormMutation,
} from "@/features/school/api/gradeFormsApi";
import { useSchoolYearFilter } from "@/features/school/useSchoolYearFilter";
import {
  GRADE_FORM_TABLE_FORMAT,
  type GradeFormTableFormat,
  resolveGradeFormTableFormat,
} from "@/features/school/types";
import { useAppSelector } from "@/store/hooks";

const inputClass =
  "h-11 w-full rounded-xl border border-border bg-white px-3 text-sm text-foreground outline-none transition-colors duration-200 placeholder:text-muted/80 focus:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

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

type GradeFormFormState = {
  title: string;
  gradeBackground: string;
  average: string;
  direction: string;
  tableFormat: GradeFormTableFormat;
  gradeFormatId: number;
  status: string;
};

function emptyForm(): GradeFormFormState {
  return {
    title: "",
    gradeBackground: "",
    average: "1",
    direction: "ltr",
    tableFormat: GRADE_FORM_TABLE_FORMAT.gradeOnTop,
    gradeFormatId: 1,
    status: "1",
  };
}

export function GradeFormForm({ gradeFormId }: { gradeFormId?: number }) {
  const router = useRouter();
  const authReady = useAppSelector(selectAuthReady);
  const { years, yearId: defaultYearId } = useSchoolYearFilter(authReady);
  const isEdit = Boolean(gradeFormId);

  const [yearId, setYearId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [classIds, setClassIds] = useState<number[]>([]);
  const [formError, setFormError] = useState<string | null>(null);

  const resolvedYearId = yearId ?? defaultYearId;

  const { data: gradeForm, isLoading: gradeFormLoading } = useGetGradeFormQuery(
    gradeFormId ?? 0,
    { skip: !authReady || !gradeFormId },
  );
  const { data: classesData } = useGetClassesQuery(
    { page: 1, limit: 100, sortOrder: "asc" },
    { skip: !authReady },
  );
  const classes = classesData?.items ?? [];

  const [createGradeForm, createState] = useCreateGradeFormMutation();
  const [updateGradeForm, updateState] = useUpdateGradeFormMutation();
  const saving = createState.isLoading || updateState.isLoading;

  useEffect(() => {
    if (!gradeForm) {
      return;
    }
    setYearId(gradeForm.yearId);
    setForm({
      title: gradeForm.title,
      gradeBackground: gradeForm.gradeBackground ?? "",
      average: gradeForm.average ? "1" : "0",
      direction: gradeForm.direction,
      tableFormat: resolveGradeFormTableFormat(gradeForm.tableFormat),
      gradeFormatId: gradeForm.gradeFormatId,
      status: gradeForm.status ? "1" : "0",
    });
    setClassIds(gradeForm.classIds);
  }, [gradeForm]);

  function toggleClass(id: number) {
    setClassIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setFormError(null);

    const title = form.title.trim();
    if (!title) {
      setFormError("Title is required.");
      return;
    }
    if (!resolvedYearId) {
      setFormError("Year is required.");
      return;
    }

    try {
      if (isEdit && gradeFormId) {
        await updateGradeForm({
          id: gradeFormId,
          body: {
            title,
            yearId: resolvedYearId,
            gradeBackground: form.gradeBackground.trim() || undefined,
            average: form.average === "1",
            direction: form.direction,
            tableFormat: form.tableFormat,
            gradeFormatId: form.gradeFormatId,
            status: form.status === "1",
            classIds,
          },
        }).unwrap();
      } else {
        await createGradeForm({
          title,
          yearId: resolvedYearId,
          gradeBackground: form.gradeBackground.trim() || undefined,
          average: form.average === "1",
          direction: form.direction,
          tableFormat: form.tableFormat,
          gradeFormatId: form.gradeFormatId,
          status: form.status === "1",
          classIds: classIds.length > 0 ? classIds : undefined,
        }).unwrap();
      }

      router.push("/grade-forms");
    } catch (error) {
      setFormError(getApiErrorMessage(error, "Could not save grade form"));
    }
  }

  if (isEdit && gradeFormLoading) {
    return (
      <div className="rounded-2xl bg-white p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <LoadingDots label="Loading grade form" />
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 rounded-2xl bg-white p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] sm:p-6"
    >
      <div className="grid gap-4 md:grid-cols-2">
        <Field id="grade-form-title" label="Title" required>
          <input
            id="grade-form-title"
            type="text"
            className={inputClass}
            value={form.title}
            onChange={(event) =>
              setForm((current) => ({ ...current, title: event.target.value }))
            }
            placeholder="Primary Report Card"
          />
        </Field>

        <Field id="grade-form-year" label="Year" required>
          <YearFilterSelect
            years={years}
            value={resolvedYearId}
            onChange={setYearId}
          />
        </Field>

        <Field id="grade-form-background" label="Grade background">
          <input
            id="grade-form-background"
            type="text"
            className={inputClass}
            value={form.gradeBackground}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                gradeBackground: event.target.value,
              }))
            }
            placeholder="Image path or style value"
          />
        </Field>

        <Field id="grade-form-average" label="Average" required>
          <FilterSelect
            label="Average"
            value={form.average}
            options={[
              { value: "1", label: "Yes" },
              { value: "0", label: "No" },
            ]}
            onChange={(value) =>
              setForm((current) => ({ ...current, average: value }))
            }
          />
        </Field>

        <Field id="grade-form-direction" label="Direction" required>
          <FilterSelect
            label="Direction"
            value={form.direction}
            options={[
              { value: "ltr", label: "Left to right (LTR)" },
              { value: "rtl", label: "Right to left (RTL)" },
            ]}
            onChange={(value) =>
              setForm((current) => ({ ...current, direction: value }))
            }
          />
        </Field>

        <Field id="grade-form-table-format" label="Table format" required>
          <FilterSelect
            label="Table format"
            value={form.tableFormat}
            options={[
              {
                value: GRADE_FORM_TABLE_FORMAT.courseOnTop,
                label: "Course on top",
              },
              {
                value: GRADE_FORM_TABLE_FORMAT.gradeOnTop,
                label: "Grade on top",
              },
            ]}
            onChange={(value: GradeFormTableFormat) =>
              setForm((current) => ({ ...current, tableFormat: value }))
            }
          />
        </Field>

        <Field id="grade-form-grade-format" label="Grade format" required>
          <FilterSelect
            label="Grade format"
            value={form.gradeFormatId}
            options={[
              { value: 1, label: "Numeric" },
              { value: 2, label: "Letter" },
            ]}
            onChange={(value) =>
              setForm((current) => ({ ...current, gradeFormatId: value }))
            }
          />
        </Field>

        <Field id="grade-form-status" label="Status" required>
          <FilterSelect
            label="Status"
            value={form.status}
            options={[
              { value: "1", label: "Active" },
              { value: "0", label: "Inactive" },
            ]}
            onChange={(value) =>
              setForm((current) => ({ ...current, status: value }))
            }
          />
        </Field>
      </div>

      <fieldset className="rounded-xl border border-border p-4">
        <legend className="px-1 text-sm font-medium text-foreground">
          Classes
        </legend>
        {classes.length === 0 ? (
          <p className="text-sm text-muted">No classes available.</p>
        ) : (
          <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {classes.map((item) => {
              const checked = classIds.includes(item.id);
              return (
                <label
                  key={item.id}
                  className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-primary-soft"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleClass(item.id)}
                    className="h-4 w-4 accent-primary"
                  />
                  <span>{item.className}</span>
                </label>
              );
            })}
          </div>
        )}
      </fieldset>

      {formError ? (
        <p className="text-sm text-red-600" role="alert">
          {formError}
        </p>
      ) : null}

      <div className="flex justify-end gap-3 border-t border-stone-100 pt-4">
        <button
          type="button"
          onClick={() => router.push("/grade-forms")}
          className="inline-flex h-11 cursor-pointer items-center rounded-lg border border-border px-4 text-sm font-medium text-foreground hover:bg-primary-soft"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="inline-flex h-11 cursor-pointer items-center rounded-lg bg-primary px-4 text-sm font-medium text-on-primary hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? "Saving" : isEdit ? "Update grade form" : "Save grade form"}
        </button>
      </div>
    </form>
  );
}
