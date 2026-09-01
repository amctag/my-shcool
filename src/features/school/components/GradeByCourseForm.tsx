"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { FilterSelect } from "@/components/dashboard/FilterSelect";
import { LoadingDots } from "@/components/dashboard/TableLoading";
import { YearFilterSelect } from "@/components/dashboard/YearFilterSelect";
import { getApiErrorMessage } from "@/lib/getApiErrorMessage";
import { selectAuthReady } from "@/features/auth/authSlice";
import { useGetClassesQuery } from "@/features/school/api/classesApi";
import { useGetClassCoursesQuery } from "@/features/school/api/coursesApi";
import {
  useGetDashboardGradeTypesListQuery,
  useLazyGetGradeByCourseCandidatesQuery,
  useSaveGradeByCourseMutation,
} from "@/features/school/api/gradesApi";
import { useGetSectionsQuery } from "@/features/school/api/sectionsApi";
import { useSchoolYearFilter } from "@/features/school/useSchoolYearFilter";
import { useAppSelector } from "@/store/hooks";
import type { DashboardGradeByCourseStudent } from "@/features/school/types";

const inputClass =
  "h-11 rounded-xl border border-border bg-white px-3 text-sm text-foreground outline-none transition-colors duration-200 placeholder:text-muted/80 focus:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

const inlineInputClass = `${inputClass} w-full min-w-[7rem] shrink-0 sm:w-28`;

type StudentEntry = {
  registrationId: number;
  studentName: string;
  grade: string;
  comment: string;
};

type GradeByCourseFormProps = {
  initialYearId?: number;
  initialClassId?: number;
  initialSectionId?: number;
  initialCourseId?: number;
  initialGradeTypeId?: number;
};

export function GradeByCourseForm({
  initialYearId = 0,
  initialClassId = 0,
  initialSectionId = 0,
  initialCourseId = 0,
  initialGradeTypeId = 0,
}: GradeByCourseFormProps) {
  const router = useRouter();
  const authReady = useAppSelector(selectAuthReady);
  const { years, yearId: defaultYearId } = useSchoolYearFilter(authReady);

  const [yearId, setYearId] = useState<number | null>(
    initialYearId > 0 ? initialYearId : null,
  );
  const [classId, setClassId] = useState(initialClassId);
  const [sectionId, setSectionId] = useState(initialSectionId);
  const [courseId, setCourseId] = useState(initialCourseId);
  const [gradeTypeId, setGradeTypeId] = useState(initialGradeTypeId);
  const [maxGrade, setMaxGrade] = useState("");
  const [publishDate, setPublishDate] = useState("");
  const [students, setStudents] = useState<StudentEntry[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [autoLoaded, setAutoLoaded] = useState(false);

  const resolvedYearId = yearId ?? defaultYearId;

  const { data: classesData } = useGetClassesQuery(
    { page: 1, limit: 100, sortOrder: "asc" },
    { skip: !authReady },
  );
  const classes = classesData?.items ?? [];

  const { data: sectionsData, isSuccess: sectionsReady } = useGetSectionsQuery(
    {
      page: 1,
      limit: 100,
      classId: classId > 0 ? classId : undefined,
      yearId: resolvedYearId ?? undefined,
      sortBy: "section",
      sortOrder: "asc",
    },
    { skip: !authReady || !resolvedYearId || classId <= 0 },
  );
  const sections = sectionsData?.items ?? [];

  const { data: classCoursesData, isSuccess: coursesReady } =
    useGetClassCoursesQuery(
    {
      page: 1,
      limit: 100,
      classId: classId > 0 ? classId : undefined,
      yearId: resolvedYearId ?? undefined,
      status: "active",
      sortBy: "course",
      sortOrder: "asc",
    },
    { skip: !authReady || !resolvedYearId || classId <= 0 },
  );
  const courses = classCoursesData?.items ?? [];

  const { data: gradeTypesData } = useGetDashboardGradeTypesListQuery(undefined, {
    skip: !authReady,
  });
  const gradeTypes = gradeTypesData?.items ?? [];

  const [fetchCandidates, candidatesState] =
    useLazyGetGradeByCourseCandidatesQuery();
  const [saveGrade, saveState] = useSaveGradeByCourseMutation();

  const loadingStudents = candidatesState.isFetching;
  const saving = saveState.isLoading;

  useEffect(() => {
    if (!sectionId || !sectionsReady) {
      return;
    }
    const stillValid = sections.some((section) => section.id === sectionId);
    if (!stillValid) {
      setSectionId(0);
      setLoaded(false);
      setStudents([]);
    }
  }, [sectionId, sections, sectionsReady]);

  useEffect(() => {
    if (!courseId || !coursesReady) {
      return;
    }
    const stillValid = courses.some((item) => item.courseId === courseId);
    if (!stillValid) {
      setCourseId(0);
      setLoaded(false);
      setStudents([]);
    }
  }, [courseId, courses, coursesReady]);

  async function loadStudents() {
    setFormError(null);
    if (!sectionId || !courseId || !gradeTypeId) {
      setFormError("Select class, section, course, and grade type first.");
      return;
    }

    try {
      const result = await fetchCandidates({
        sectionId,
        courseId,
        gradeTypeId,
      }).unwrap();

      if (result.gradeSheetId != null) {
        setMaxGrade(String(result.maxGrade));
        setPublishDate(
          result.publishDate ?? new Date().toISOString().slice(0, 10),
        );
      } else if (!publishDate.trim()) {
        setPublishDate(
          result.publishDate ?? new Date().toISOString().slice(0, 10),
        );
      }

      setStudents(
        result.students.map((student: DashboardGradeByCourseStudent) => ({
          registrationId: student.registrationId,
          studentName: student.studentName,
          grade: student.grade != null ? String(student.grade) : "",
          comment: student.comment ?? "",
        })),
      );
      setLoaded(true);
    } catch (error) {
      setFormError(getApiErrorMessage(error, "Could not load students"));
      setLoaded(false);
      setStudents([]);
    }
  }

  useEffect(() => {
    if (
      autoLoaded ||
      !authReady ||
      !initialSectionId ||
      !initialCourseId ||
      !initialGradeTypeId ||
      !sectionsReady ||
      !coursesReady
    ) {
      return;
    }

    const sectionOk = sections.some((section) => section.id === sectionId);
    const courseOk = courses.some((item) => item.courseId === courseId);
    if (!sectionOk || !courseOk) {
      return;
    }

    setAutoLoaded(true);
    void loadStudents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    authReady,
    autoLoaded,
    initialSectionId,
    initialCourseId,
    initialGradeTypeId,
    sectionsReady,
    coursesReady,
    sectionId,
    courseId,
    sections,
    courses,
  ]);

  function updateStudent(
    registrationId: number,
    field: "grade" | "comment",
    value: string,
  ) {
    setStudents((current) =>
      current.map((student) =>
        student.registrationId === registrationId
          ? { ...student, [field]: value }
          : student,
      ),
    );
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setFormError(null);

    if (!sectionId || !courseId || !gradeTypeId) {
      setFormError("Select class, section, course, and grade type.");
      return;
    }

    if (!maxGrade.trim()) {
      setFormError("Enter max grade before saving.");
      return;
    }

    const parsedMax = Number(maxGrade);
    if (!Number.isFinite(parsedMax) || parsedMax <= 0) {
      setFormError("Enter a valid max grade.");
      return;
    }

    if (!loaded || students.length === 0) {
      setFormError("Load students before saving.");
      return;
    }

    for (const student of students) {
      if (!student.grade.trim()) {
        continue;
      }
      const value = Number(student.grade);
      if (!Number.isFinite(value) || value < 0) {
        setFormError(`Invalid grade for ${student.studentName}.`);
        return;
      }
      if (value > parsedMax) {
        setFormError(
          `Grade for ${student.studentName} cannot exceed ${parsedMax}.`,
        );
        return;
      }
    }

    try {
      const result = await saveGrade({
        sectionId,
        courseId,
        gradeTypeId,
        maxGrade: parsedMax,
        publishDate: publishDate || undefined,
        entries: students.map((student) => ({
          registrationId: student.registrationId,
          grade: student.grade.trim() ? Number(student.grade) : undefined,
          comment: student.comment.trim() || undefined,
        })),
      }).unwrap();

      router.push(`/grades/by-course/view?gradeId=${result.id}&saved=1`);
    } catch (error) {
      setFormError(getApiErrorMessage(error, "Could not save grades"));
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 rounded-2xl bg-white p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] sm:p-6"
    >
      <div className="flex flex-wrap items-center gap-2">
        <YearFilterSelect
          years={years}
          value={resolvedYearId}
          onChange={(nextYearId) => {
            setYearId(nextYearId);
            setSectionId(0);
            setCourseId(0);
            setLoaded(false);
            setStudents([]);
          }}
        />
        <FilterSelect
          label="Class"
          value={classId}
          options={[
            { value: 0, label: "Select class" },
            ...classes.map((item) => ({
              value: item.id,
              label: item.className,
            })),
          ]}
          onChange={(value) => {
            setClassId(value);
            setSectionId(0);
            setCourseId(0);
            setLoaded(false);
            setStudents([]);
          }}
        />
        <FilterSelect
          label="Section"
          value={sectionId}
          options={[
            { value: 0, label: "Select section" },
            ...sections.map((item) => ({
              value: item.id,
              label: item.sectionTitle,
            })),
          ]}
          onChange={(value) => {
            setSectionId(value);
            setLoaded(false);
            setStudents([]);
          }}
        />
        <FilterSelect
          label="Course"
          value={courseId}
          options={[
            { value: 0, label: "Select course" },
            ...courses.map((item) => ({
              value: item.courseId,
              label: item.courseTitle,
            })),
          ]}
          onChange={(value) => {
            setCourseId(value);
            setLoaded(false);
            setStudents([]);
          }}
        />
        <FilterSelect
          label="Grade type"
          value={gradeTypeId}
          options={[
            { value: 0, label: "Select grade type" },
            ...gradeTypes.map((item) => ({
              value: item.id,
              label: item.title,
            })),
          ]}
          onChange={(value) => {
            setGradeTypeId(value);
            setLoaded(false);
            setStudents([]);
          }}
        />
        <label className="sr-only" htmlFor="grade-max">
          Max grade
        </label>
        <input
          id="grade-max"
          type="number"
          min={1}
          step="0.01"
          className={inlineInputClass}
          value={maxGrade}
          onChange={(event) => setMaxGrade(event.target.value)}
          placeholder="Max grade"
          aria-label="Max grade"
        />
        <label className="sr-only" htmlFor="grade-date">
          Date
        </label>
        <input
          id="grade-date"
          type="date"
          className={`${inlineInputClass} sm:w-40`}
          value={publishDate}
          onChange={(event) => setPublishDate(event.target.value)}
          aria-label="Date"
        />
        <button
          type="button"
          onClick={() => void loadStudents()}
          disabled={
            loadingStudents ||
            !sectionId ||
            !courseId ||
            !gradeTypeId ||
            !maxGrade.trim()
          }
          className="inline-flex h-11 shrink-0 cursor-pointer items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-on-primary hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Search aria-hidden className="h-4 w-4" />
          {loadingStudents ? "Loading…" : "Load students"}
        </button>
      </div>

      {loadingStudents ? (
        <div className="rounded-xl border border-border bg-primary-soft/30 px-4 py-3">
          <LoadingDots label="Loading students" />
        </div>
      ) : null}

      {loaded && students.length > 0 ? (
        <div className="overflow-hidden rounded-2xl border border-stone-200">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-stone-100 bg-stone-50/80">
                <tr>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted">
                    Student
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted">
                    Grade
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted">
                    Note
                  </th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr
                    key={student.registrationId}
                    className="border-b border-stone-100 last:border-b-0 odd:bg-white even:bg-primary-soft/30"
                  >
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-foreground">
                      {student.studentName}
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        min={0}
                        max={Number(maxGrade) || undefined}
                        step="0.01"
                        className={`${inputClass} max-w-[8rem]`}
                        value={student.grade}
                        onChange={(event) =>
                          updateStudent(
                            student.registrationId,
                            "grade",
                            event.target.value,
                          )
                        }
                        placeholder="—"
                        aria-label={`Grade for ${student.studentName}`}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        className={inputClass}
                        value={student.comment}
                        onChange={(event) =>
                          updateStudent(
                            student.registrationId,
                            "comment",
                            event.target.value,
                          )
                        }
                        placeholder="Optional note"
                        aria-label={`Note for ${student.studentName}`}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : loaded ? (
        <p className="rounded-xl border border-border bg-primary-soft/40 px-4 py-3 text-sm text-muted">
          No registered students found for this section.
        </p>
      ) : null}

      {formError ? (
        <p className="text-sm text-red-600" role="alert">
          {formError}
        </p>
      ) : null}

      <div className="flex justify-end gap-3 border-t border-stone-100 pt-4">
        <button
          type="button"
          onClick={() => router.push("/grades/by-course")}
          className="inline-flex h-11 cursor-pointer items-center rounded-lg border border-border px-4 text-sm font-medium text-foreground hover:bg-primary-soft"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving || !loaded}
          className="inline-flex h-11 cursor-pointer items-center rounded-lg bg-primary px-4 text-sm font-medium text-on-primary hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? "Saving" : "Save grades"}
        </button>
      </div>
    </form>
  );
}
