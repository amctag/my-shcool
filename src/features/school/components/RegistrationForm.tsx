"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { getApiErrorMessage } from "@/lib/getApiErrorMessage";
import { personNameMatches } from "@/lib/personNameSearch";
import { selectAuthReady } from "@/features/auth/authSlice";
import { useGetChildrenQuery } from "@/features/school/api/childrenApi";
import { useGetClassesQuery } from "@/features/school/api/classesApi";
import {
  useCreateRegistrationMutation,
  useGetRegistrationQuery,
  useUpdateRegistrationMutation,
} from "@/features/school/api/registrationsApi";
import { useGetSectionsQuery } from "@/features/school/api/sectionsApi";
import { useSchoolYearFilter } from "@/features/school/useSchoolYearFilter";
import { useAppSelector } from "@/store/hooks";
import type { DashboardParentChild } from "@/features/school/types";
import { LoadingDots } from "@/components/dashboard/TableLoading";

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
  return personNameMatches(query, [
    student.fullName,
    student.firstName,
    student.lastName,
  ]);
}

function StudentPicker({
  id,
  studentId,
  onSelect,
  disabled,
  lockedLabel,
}: {
  id: string;
  studentId: number;
  onSelect: (studentId: number) => void;
  disabled?: boolean;
  lockedLabel?: string;
}) {
  const authReady = useAppSelector(selectAuthReady);
  const boxRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const [query, setQuery] = useState(lockedLabel ?? "");
  const [debounced, setDebounced] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (lockedLabel) {
      setQuery(lockedLabel);
    }
  }, [lockedLabel]);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(query.trim()), 250);
    return () => window.clearTimeout(timer);
  }, [query]);

  const canSearch = authReady && debounced.length >= 1 && !lockedLabel;
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
    if (open || studentId <= 0 || lockedLabel) {
      return;
    }
    const selected = data?.items.find((student) => student.id === studentId);
    if (selected) {
      setQuery(formatStudentLabel(selected));
    }
  }, [data?.items, lockedLabel, open, studentId]);

  function pick(student: DashboardParentChild) {
    onSelect(student.id);
    setQuery(formatStudentLabel(student));
    setOpen(false);
  }

  const showList = open && !disabled && !lockedLabel;

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
        disabled={disabled || Boolean(lockedLabel)}
        value={query}
        placeholder="Type first, middle, or last name"
        onFocus={() => {
          if (!disabled && !lockedLabel) {
            setOpen(true);
          }
        }}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
          if (studentId > 0) {
            onSelect(0);
          }
        }}
        className={`${inputClass} disabled:cursor-not-allowed disabled:bg-stone-50`}
      />
      {lockedLabel && studentId > 0 ? (
        <p className="mt-2 text-xs text-muted">
          Student cannot be changed here.{" "}
          <Link
            href={`/students/${studentId}`}
            className="font-medium text-primary underline-offset-2 hover:underline"
          >
            Open profile
          </Link>
        </p>
      ) : null}
      {showList ? (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-border bg-white py-1 shadow-lg"
        >
          {isFetching ? (
            <li className="px-3 py-3 text-sm text-muted">Searching…</li>
          ) : students.length === 0 ? (
            <li className="px-3 py-3 text-sm text-muted">No students match</li>
          ) : (
            students.map((student) => {
              const selected = student.id === studentId;
              return (
                <li key={student.id} role="option" aria-selected={selected}>
                  <button
                    type="button"
                    onClick={() => pick(student)}
                    className={`flex w-full cursor-pointer flex-col gap-0.5 px-3 py-2.5 text-left text-sm hover:bg-primary-soft ${
                      selected ? "bg-primary-soft" : ""
                    }`}
                  >
                    <span className="font-medium text-foreground">
                      {formatStudentLabel(student)}
                    </span>
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

export function RegistrationForm({
  registrationId,
}: {
  registrationId?: number;
}) {
  const router = useRouter();
  const authReady = useAppSelector(selectAuthReady);
  const { yearId: globalYearId } = useSchoolYearFilter(authReady);
  const isEdit = Boolean(registrationId);
  const [form, setForm] = useState(emptyForm);
  const [studentId, setStudentId] = useState(0);
  const [studentLabel, setStudentLabel] = useState("");
  const [formYearId, setFormYearId] = useState<number | null>(null);
  const [studentPickerKey, setStudentPickerKey] = useState(0);
  const [formError, setFormError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  const {
    data: registration,
    error: registrationError,
    isLoading: registrationLoading,
  } = useGetRegistrationQuery(registrationId ?? 0, {
    skip: !authReady || !registrationId,
  });

  const { data: classesData } = useGetClassesQuery(
    { page: 1, limit: 20, sortOrder: "asc" },
    { skip: !authReady },
  );
  const classes = classesData?.items ?? [];

  const classId = Number(form.classId);
  const sectionsYearId = isEdit ? formYearId : globalYearId;

  const { data: sectionsData } = useGetSectionsQuery(
    {
      page: 1,
      limit: 20,
      classId: classId > 0 ? classId : undefined,
      yearId: sectionsYearId ?? undefined,
      sortBy: "section",
      sortOrder: "asc",
    },
    { skip: !authReady || !sectionsYearId || classId <= 0 },
  );
  const sections = sectionsData?.items ?? [];

  const [createRegistration, createState] = useCreateRegistrationMutation();
  const [updateRegistration, updateState] = useUpdateRegistrationMutation();
  const saving = createState.isLoading || updateState.isLoading;

  const sectionOptions = sections.map((section) => ({
    value: String(section.id),
    label: section.sectionTitle,
  }));

  useEffect(() => {
    if (!registration || hydrated) {
      return;
    }
    setStudentId(registration.studentId);
    setStudentLabel(registration.studentName);
    setFormYearId(registration.yearId);
    setForm({
      classId: String(registration.classId),
      sectionId: String(registration.sectionId),
    });
    setHydrated(true);
  }, [hydrated, registration]);

  useEffect(() => {
    if (!form.sectionId) {
      return;
    }
    const stillValid = sections.some(
      (section) => String(section.id) === form.sectionId,
    );
    if (!stillValid && hydrated) {
      // Keep existing section while options load for the selected class/year.
      if (sections.length === 0) {
        return;
      }
      setForm((current) => ({ ...current, sectionId: "" }));
    }
  }, [form.sectionId, hydrated, sections]);

  function resetStudentPicker() {
    setStudentId(0);
    setStudentLabel("");
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
      if (isEdit && registrationId) {
        await updateRegistration({
          id: registrationId,
          body: {
            studentId,
            classId,
            sectionId,
          },
        }).unwrap();
        router.push("/registrations?saved=1");
        return;
      }

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

  if (isEdit && registrationLoading) {
    return (
      <div className="mx-auto max-w-3xl rounded-3xl border border-border bg-white p-10 shadow-sm">
        <LoadingDots label="Loading registration" />
      </div>
    );
  }

  if (isEdit && (registrationError || !registration)) {
    return (
      <p
        className="mx-auto max-w-3xl rounded-3xl border border-border bg-white px-5 py-8 text-center text-sm text-red-600 shadow-sm"
        role="alert"
      >
        {getApiErrorMessage(registrationError, "Could not load registration")}
      </p>
    );
  }

  return (
    <form
      className="mx-auto max-w-3xl rounded-3xl border border-border bg-white p-6 shadow-sm sm:p-8"
      onSubmit={(event) => {
        event.preventDefault();
        void onSave(false);
      }}
    >
      <h1 className="mb-2 text-center text-3xl font-semibold tracking-tight text-foreground">
        {isEdit ? "Edit Registration" : "Add New Registration"}
      </h1>
      {isEdit && registration ? (
        <p className="mb-8 text-center text-sm text-muted">
          {registration.yearTitle} · #{registration.id}
        </p>
      ) : (
        <div className="mb-8" />
      )}

      <div className="space-y-5">
        <Field id="studentSearch" label="Student" required>
          <div className="flex items-start gap-2">
            <div className="min-w-0 flex-1">
              <StudentPicker
                key={studentPickerKey}
                id="studentSearch"
                studentId={studentId}
                onSelect={setStudentId}
                disabled={saving}
                lockedLabel={isEdit ? studentLabel : undefined}
              />
            </div>
            {!isEdit ? (
              <Link
                href="/students/add"
                className="inline-flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-border bg-white text-foreground transition-colors hover:bg-primary-soft hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                aria-label="Add new student"
                title="Add student"
              >
                <Plus aria-hidden className="h-4 w-4" />
              </Link>
            ) : null}
          </div>
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
        {!isEdit ? (
          <button
            type="button"
            disabled={saving}
            onClick={() => void onSave(true)}
            className="inline-flex h-11 cursor-pointer items-center justify-center rounded-xl bg-red-600 px-6 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            Save &amp; New
          </button>
        ) : null}
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
