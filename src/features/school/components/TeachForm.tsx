"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { getApiErrorMessage } from "@/lib/getApiErrorMessage";
import { selectAuthReady } from "@/features/auth/authSlice";
import { useGetClassesQuery } from "@/features/school/api/classesApi";
import {
  useGetClassCoursesQuery,
  useGetCoursesQuery,
} from "@/features/school/api/coursesApi";
import { useGetSectionsQuery, useGetYearsQuery } from "@/features/school/api/sectionsApi";
import { useGetTeachersQuery } from "@/features/school/api/teachersApi";
import {
  useCreateTeachMutation,
  useGetTeachesQuery,
  useGetTeachQuery,
  useUpdateTeachMutation,
} from "@/features/school/api/teachesApi";
import { useAppSelector } from "@/store/hooks";
import type { SaveTeachBody } from "@/features/school/types";

const inputClass =
  "h-11 w-full rounded-xl border border-border bg-white px-3 text-sm text-foreground outline-none transition-colors duration-200 placeholder:text-muted/80 focus:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

type FormState = {
  yearId: string;
  classId: string;
  sectionId: string;
  courseId: string;
  courseIds: number[];
  teacherId: string;
};

function emptyForm(): FormState {
  return {
    yearId: "",
    classId: "",
    sectionId: "",
    courseId: "",
    courseIds: [],
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

export function TeachForm({
  teachId,
  readOnly = false,
}: {
  teachId?: number;
  readOnly?: boolean;
}) {
  const router = useRouter();
  const authReady = useAppSelector(selectAuthReady);
  const isEdit = Boolean(teachId) && !readOnly;
  const [form, setForm] = useState<FormState>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);

  const yearId = Number(form.yearId) || 0;
  const classId = Number(form.classId) || 0;
  const sectionId = Number(form.sectionId) || 0;
  const teacherId = Number(form.teacherId) || 0;

  const { data: item, isLoading } = useGetTeachQuery(teachId ?? 0, {
    skip: !authReady || !teachId,
  });
  const { data: classesData } = useGetClassesQuery(
    { page: 1, limit: 20 },
    { skip: !authReady },
  );
  const { data: schoolCourses = [] } = useGetCoursesQuery(undefined, {
    skip: !authReady,
  });
  const { data: classCoursesData } = useGetClassCoursesQuery(
    {
      page: 1,
      limit: 20,
      classId,
      yearId,
      status: "active",
      sortBy: "course",
      sortOrder: "asc",
    },
    { skip: !authReady || !classId || !yearId },
  );
  const { data: years = [] } = useGetYearsQuery(undefined, {
    skip: !authReady,
  });
  const { data: teachersData } = useGetTeachersQuery(
    { page: 1, limit: 20, sortBy: "name", sortOrder: "asc" },
    { skip: !authReady },
  );
  const { data: sectionsData } = useGetSectionsQuery(
    {
      page: 1,
      limit: 20,
      classId,
      yearId,
      sortBy: "section",
      sortOrder: "asc",
    },
    { skip: !authReady || !classId || !yearId },
  );
  const { data: classTeaches } = useGetTeachesQuery(
    {
      page: 1,
      limit: 20,
      classId,
      yearId,
      sortBy: "id",
      sortOrder: "asc",
    },
    { skip: !authReady || !classId || !yearId },
  );
  const [createTeach, createState] = useCreateTeachMutation();
  const [updateTeach, updateState] = useUpdateTeachMutation();
  const saving = createState.isLoading || updateState.isLoading;
  const teachers = teachersData?.items ?? [];
  const sections = sectionsData?.items ?? [];
  const classes = classesData?.items ?? [];
  const classCourses = classCoursesData?.items ?? [];
  const courses = useMemo(() => {
    if (classCourses.length > 0) {
      return classCourses.map((item) => ({
        id: item.courseId,
        title: item.courseTitle,
      }));
    }
    return schoolCourses.map((item) => ({ id: item.id, title: item.title }));
  }, [classCourses, schoolCourses]);

  const targetSectionIds = useMemo(() => {
    if (sectionId) {
      return [sectionId];
    }
    return sections.map((section) => section.id);
  }, [sectionId, sections]);

  const courseFlags = useMemo(() => {
    const flags = new Map<
      number,
      { takenByOther: boolean; alreadyYours: boolean }
    >();
    for (const course of courses) {
      const rows = (classTeaches?.items ?? []).filter(
        (row) =>
          row.courseId === course.id &&
          targetSectionIds.includes(row.sectionId) &&
          (!teachId || row.id !== teachId),
      );
      const takenByOther =
        targetSectionIds.length > 0 &&
        targetSectionIds.every((id) =>
          rows.some((row) => row.sectionId === id && row.teacherId !== teacherId),
        );
      const alreadyYours =
        teacherId > 0 &&
        targetSectionIds.length > 0 &&
        targetSectionIds.every((id) =>
          rows.some((row) => row.sectionId === id && row.teacherId === teacherId),
        );
      flags.set(course.id, { takenByOther, alreadyYours });
    }
    return flags;
  }, [classTeaches?.items, courses, targetSectionIds, teacherId, teachId]);

  useEffect(() => {
    if (teachId || form.yearId) {
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
  }, [form.yearId, teachId, years]);

  useEffect(() => {
    if (!item) {
      return;
    }
    setForm({
      yearId: String(item.yearId),
      classId: String(item.classId),
      sectionId: String(item.sectionId),
      courseId: String(item.courseId),
      courseIds: [item.courseId],
      teacherId: String(item.teacherId),
    });
  }, [item]);

  function toggleCourse(courseId: number) {
    const flags = courseFlags.get(courseId);
    if (flags?.takenByOther || flags?.alreadyYours) {
      return;
    }
    setForm((current) => {
      const selected = current.courseIds.includes(courseId)
        ? current.courseIds.filter((id) => id !== courseId)
        : [...current.courseIds, courseId];
      return { ...current, courseIds: selected };
    });
  }

  async function onSave() {
    setFormError(null);
    const selectedTeacherId = Number(form.teacherId);
    const selectedClassId = Number(form.classId);
    const selectedSectionId = Number(form.sectionId) || undefined;
    const selectedYearId = Number(form.yearId);
    if (!selectedTeacherId || !selectedClassId || !selectedYearId) {
      setFormError("Teacher, class, and year are required");
      return;
    }

    const body: SaveTeachBody = {
      teacherId: selectedTeacherId,
      classId: selectedClassId,
      sectionId: selectedSectionId,
      yearId: selectedYearId,
    };

    try {
      if (teachId) {
        const courseId = Number(form.courseId);
        if (!courseId || !selectedSectionId) {
          setFormError("Course and section are required");
          return;
        }
        if (courseFlags.get(courseId)?.takenByOther) {
          setFormError(
            "This class already has another teacher for that course this year",
          );
          return;
        }
        await updateTeach({
          id: teachId,
          body: { ...body, courseId },
        }).unwrap();
      } else {
        const courseIds = form.courseIds.filter((id) => {
          const flags = courseFlags.get(id);
          return !flags?.takenByOther && !flags?.alreadyYours;
        });
        if (courseIds.length === 0) {
          setFormError("Select at least one course for this class");
          return;
        }
        await createTeach({ ...body, courseIds }).unwrap();
      }
      router.push("/teaches");
    } catch (caught) {
      setFormError(getApiErrorMessage(caught, "Could not save teach"));
    }
  }

  if (teachId && isLoading) {
    return <p className="text-sm text-muted">Loading teach…</p>;
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
        {readOnly ? "View teach" : isEdit ? "Edit teach" : "Add teach"}
      </h1>
      <fieldset disabled={readOnly} className="min-w-0 border-0 p-0">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="yearId" label="Year" required>
            <select
              id="yearId"
              required
              value={form.yearId}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  yearId: event.target.value,
                  sectionId: "",
                  courseIds: [],
                }))
              }
              className={`${inputClass} cursor-pointer`}
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
          <Field id="classId" label="Class" required>
            <select
              id="classId"
              required
              value={form.classId}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  classId: event.target.value,
                  sectionId: "",
                  courseIds: [],
                }))
              }
              className={`${inputClass} cursor-pointer`}
            >
              <option value="">Choose class</option>
              {classes.map((itemClass) => (
                <option key={itemClass.id} value={String(itemClass.id)}>
                  {itemClass.className} ({itemClass.stageTitle})
                </option>
              ))}
            </select>
          </Field>
          <Field id="sectionId" label="Section">
            <select
              id="sectionId"
              disabled={!classId || !yearId}
              value={form.sectionId}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  sectionId: event.target.value,
                  courseIds: [],
                }))
              }
              className={`${inputClass} cursor-pointer disabled:bg-stone-50`}
            >
              <option value="">
                {!classId || !yearId
                  ? "Choose class and year first"
                  : "All sections of this class"}
              </option>
              {sections.map((section) => (
                <option key={section.id} value={String(section.id)}>
                  {section.sectionTitle}
                </option>
              ))}
            </select>
          </Field>
          <Field id="teacherId" label="Teacher" required>
            <select
              id="teacherId"
              required
              value={form.teacherId}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  teacherId: event.target.value,
                }))
              }
              className={`${inputClass} cursor-pointer`}
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

        {teachId ? (
          <div className="mt-4">
            <Field id="courseId" label="Course" required>
              <select
                id="courseId"
                required
                value={form.courseId}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    courseId: event.target.value,
                  }))
                }
                className={`${inputClass} cursor-pointer`}
              >
                <option value="">Choose course</option>
                {courses.map((course) => {
                  const taken = courseFlags.get(course.id)?.takenByOther;
                  return (
                    <option
                      key={course.id}
                      value={String(course.id)}
                      disabled={taken}
                    >
                      {taken ? `${course.title} (used)` : course.title}
                    </option>
                  );
                })}
              </select>
            </Field>
          </div>
        ) : (
          <div className="mt-6">
            <p className="mb-1.5 text-sm font-medium text-foreground">
              Courses *
            </p>
            <p className="mb-3 text-sm text-muted">
              Select every course this teacher should teach in this class.
              Leave section empty to apply to all sections.
            </p>
            {!classId || !yearId ? (
              <p className="text-sm text-muted">Choose a class first.</p>
            ) : courses.length === 0 ? (
              <p className="text-sm text-muted">
                No courses are linked to this class yet.
              </p>
            ) : (
              <div className="flex flex-wrap gap-3">
                {courses.map((course) => {
                  const flags = courseFlags.get(course.id);
                  const taken = Boolean(flags?.takenByOther);
                  const yours = Boolean(flags?.alreadyYours);
                  const checked = yours || form.courseIds.includes(course.id);
                  const disabled = taken || yours;
                  return (
                    <label
                      key={course.id}
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
                        disabled={disabled}
                        onChange={() => toggleCourse(course.id)}
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
                      {taken
                        ? `${course.title} (used)`
                        : yours
                          ? `${course.title} (already assigned)`
                          : course.title}
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        )}

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
