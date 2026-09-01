"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { getApiErrorMessage } from "@/lib/getApiErrorMessage";
import { selectAuthReady } from "@/features/auth/authSlice";
import { useGetChildrenQuery } from "@/features/school/api/childrenApi";
import { useGetClassesQuery } from "@/features/school/api/classesApi";
import { useCreateRegistrationMutation } from "@/features/school/api/registrationsApi";
import { useGetSectionsQuery } from "@/features/school/api/sectionsApi";
import { useSchoolYearFilter } from "@/features/school/useSchoolYearFilter";
import { useAppSelector } from "@/store/hooks";
import type { DashboardParentChild } from "@/features/school/types";

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
    <div className="grid gap-3 sm:grid-cols-[10rem_minmax(0,1fr)] sm:items-center">
      <label
        htmlFor={id}
        className="text-sm font-semibold text-primary sm:text-right"
      >
        {label}
        {required ? " *" : ""}
      </label>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

function formatStudentLabel(student: DashboardParentChild): string {
  return student.fullName.trim();
}

function studentMatches(student: DashboardParentChild, query: string): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) {
    return false;
  }

  return [student.fullName, student.firstName, student.lastName].some((part) =>
    part?.toLowerCase().includes(needle),
  );
}

function StudentPicker({
  id,
  studentId,
  onSelect,
  disabled,
}: {
  id: string;
  studentId: number;
  onSelect: (studentId: number) => void;
  disabled?: boolean;
}) {
  const authReady = useAppSelector(selectAuthReady);
  const boxRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(query.trim()), 250);
    return () => window.clearTimeout(timer);
  }, [query]);

  const canSearch = authReady && debounced.length >= 1;
  const { data, isFetching } = useGetChildrenQuery(
    {
      page: 1,
      limit: 20,
      search: debounced,
      sortBy: "name",
      sortOrder: "asc",
    },
    { skip: !canSearch },
  );

  const students = (data?.items ?? []).filter((student) =>
    studentMatches(student, debounced),
  );

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!boxRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  useEffect(() => {
    if (open || studentId <= 0) {
      return;
    }
    const selected = data?.items.find((student) => student.id === studentId);
    if (selected) {
      setQuery(formatStudentLabel(selected));
    }
  }, [data?.items, open, studentId]);

  function pick(student: DashboardParentChild) {
    onSelect(student.id);
    setQuery(formatStudentLabel(student));
    setOpen(false);
  }

  const showList = open && !disabled;

  return (
    <div ref={boxRef} className="relative">
      <input
        id={id}
        type="text"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={showList}
        aria-controls={listId}
        autoComplete="off"
        disabled={disabled}
        value={query}
        placeholder="Type first, middle, or last name"
        onFocus={() => {
          if (!disabled) {
            setOpen(true);
          }
        }}
        onChange={(event) => {
          const next = event.target.value;
          setQuery(next);
          setOpen(true);
          if (studentId > 0) {
            onSelect(0);
          }
        }}
        onKeyDown={(event) => {
          if (event.key !== "Enter" || students.length === 0) {
            return;
          }
          event.preventDefault();
          pick(students[0]);
        }}
        className={inputClass}
      />
      {showList ? (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-border bg-white py-1 shadow-[0_8px_30px_rgb(0,0,0,0.08)]"
        >
          {debounced.length < 1 ? (
            <li className="px-3 py-3 text-sm text-muted">
              Type a first, middle, or last name
            </li>
          ) : isFetching && students.length === 0 ? (
            <li className="px-3 py-3 text-sm text-muted">Searching…</li>
          ) : students.length === 0 ? (
            <li className="px-3 py-3 text-sm text-muted">No students match</li>
          ) : (
            students.map((student) => {
              const label = formatStudentLabel(student);
              const active = student.id === studentId;
              return (
                <li key={student.id} role="option" aria-selected={active}>
                  <button
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => pick(student)}
                    className={`flex min-h-11 w-full cursor-pointer flex-col justify-center px-3 text-left text-sm transition-colors duration-200 ${
                      active
                        ? "bg-primary-soft font-medium text-primary"
                        : "text-foreground hover:bg-primary-soft hover:text-primary"
                    }`}
                  >
                    <span>{label}</span>
                    {student.className || student.sectionName ? (
                      <span className="text-xs text-muted">
                        {[student.className, student.sectionName]
                          .filter(Boolean)
                          .join(" · ")}
                      </span>
                    ) : null}
                  </button>
                </li>
              );
            })
          )}
        </ul>
      ) : null}
    </div>
  );
}

function emptyForm() {
  return {
    classId: "",
    sectionId: "",
  };
}

export function RegistrationForm() {
  const router = useRouter();
  const authReady = useAppSelector(selectAuthReady);
  const { yearId } = useSchoolYearFilter(authReady);
  const [form, setForm] = useState(emptyForm);
  const [studentId, setStudentId] = useState(0);
  const [studentPickerKey, setStudentPickerKey] = useState(0);
  const [formError, setFormError] = useState<string | null>(null);

  const { data: classesData } = useGetClassesQuery(
    { page: 1, limit: 100, sortOrder: "asc" },
    { skip: !authReady },
  );
  const classes = classesData?.items ?? [];

  const classId = Number(form.classId);

  const { data: sectionsData } = useGetSectionsQuery(
    {
      page: 1,
      limit: 100,
      classId: classId > 0 ? classId : undefined,
      yearId: yearId ?? undefined,
      sortBy: "section",
      sortOrder: "asc",
    },
    { skip: !authReady || !yearId || classId <= 0 },
  );
  const sections = sectionsData?.items ?? [];

  const [createRegistration, createState] = useCreateRegistrationMutation();
  const saving = createState.isLoading;

  const sectionOptions = sections.map((section) => ({
    value: String(section.id),
    label: section.sectionTitle,
  }));

  useEffect(() => {
    if (!form.sectionId) {
      return;
    }
    const stillValid = sections.some(
      (section) => String(section.id) === form.sectionId,
    );
    if (!stillValid) {
      setForm((current) => ({ ...current, sectionId: "" }));
    }
  }, [form.sectionId, sections]);

  function resetStudentPicker() {
    setStudentId(0);
    setStudentPickerKey((current) => current + 1);
  }

  async function onSave(saveAndNew: boolean) {
    setFormError(null);

    const sectionId = Number(form.sectionId);

    if (!studentId) {
      setFormError("Student is required.");
      return;
    }
    if (!classId) {
      setFormError("Class is required.");
      return;
    }
    if (!sectionId) {
      setFormError("Section is required.");
      return;
    }

    try {
      await createRegistration({
        studentId,
        classId,
        sectionId,
      }).unwrap();

      if (saveAndNew) {
        setForm(emptyForm());
        resetStudentPicker();
        return;
      }

      router.push("/registrations?saved=1");
    } catch (error) {
      setFormError(getApiErrorMessage(error, "Could not save registration"));
    }
  }

  return (
    <form
      className="mx-auto max-w-3xl rounded-3xl border border-border bg-white p-6 shadow-sm sm:p-8"
      onSubmit={(event) => {
        event.preventDefault();
        void onSave(false);
      }}
    >
      <h1 className="mb-8 text-center text-3xl font-semibold tracking-tight text-foreground">
        Add New Registration
      </h1>

      <div className="space-y-5">
        <Field id="studentSearch" label="Student" required>
          <StudentPicker
            key={studentPickerKey}
            id="studentSearch"
            studentId={studentId}
            onSelect={setStudentId}
            disabled={saving}
          />
        </Field>

        <Field id="classId" label="Classes" required>
          <select
            id="classId"
            required
            value={form.classId}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                classId: event.target.value,
                sectionId: "",
              }))
            }
            className={`${inputClass} cursor-pointer`}
          >
            <option value="">----Select classe----</option>
            {classes.map((item) => (
              <option key={item.id} value={String(item.id)}>
                {item.className}
              </option>
            ))}
          </select>
        </Field>

        <Field id="sectionId" label="Section" required>
          <select
            id="sectionId"
            required
            value={form.sectionId}
            disabled={!classId}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                sectionId: event.target.value,
              }))
            }
            className={`${inputClass} cursor-pointer disabled:cursor-not-allowed disabled:bg-stone-50`}
          >
            <option value="">
              {!classId
                ? "Select a class first"
                : sectionOptions.length === 0
                  ? "No sections for this class"
                  : "----Select Section----"}
            </option>
            {sectionOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>
      </div>

      {formError ? (
        <p className="mt-5 text-sm text-red-600" role="alert">
          {formError}
        </p>
      ) : null}

      <div className="mt-8 flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex h-11 cursor-pointer items-center justify-center rounded-xl bg-primary px-6 text-sm font-medium text-on-primary hover:bg-primary-hover disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save"}
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={() => void onSave(true)}
          className="inline-flex h-11 cursor-pointer items-center justify-center rounded-xl bg-red-600 px-6 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
        >
          Save &amp; New
        </button>
        <button
          type="button"
          onClick={() => router.push("/registrations")}
          className="inline-flex h-11 cursor-pointer items-center justify-center rounded-xl border border-border px-6 text-sm font-medium hover:bg-primary-soft"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
