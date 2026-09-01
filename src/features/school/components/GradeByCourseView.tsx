"use client";

import Link from "next/link";
import { Pencil } from "lucide-react";
import { LoadingDots } from "@/components/dashboard/TableLoading";
import { getApiErrorMessage } from "@/lib/getApiErrorMessage";
import { useGetGradeByCourseQuery } from "@/features/school/api/gradesApi";
import { selectAuthReady, selectAccessToken } from "@/features/auth/authSlice";
import { useAppSelector } from "@/store/hooks";

type GradeByCourseViewProps = {
  gradeId: number;
  showEditLink?: boolean;
};

function parseApiDate(value: string): Date | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const date = trimmed.includes("T")
    ? new Date(trimmed)
    : new Date(`${trimmed}T00:00:00`);

  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDate(value: string | null): string {
  if (!value) {
    return "—";
  }

  const date = parseApiDate(value);
  if (!date) {
    return "—";
  }

  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

function formatDateTime(value: string): string {
  const date = parseApiDate(value);
  if (!date) {
    return "—";
  }

  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function GradeByCourseView({
  gradeId,
  showEditLink = false,
}: GradeByCourseViewProps) {
  const ready = useAppSelector(selectAuthReady);
  const accessToken = useAppSelector(selectAccessToken);
  const canFetch = ready && Boolean(accessToken);

  const { data, error, isLoading } = useGetGradeByCourseQuery(gradeId, {
    skip: !canFetch,
  });

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-border bg-white px-6 py-10 text-center text-sm text-muted">
        <LoadingDots label="Loading grades" />
      </div>
    );
  }

  if (error) {
    return (
      <p
        className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700"
        role="alert"
      >
        {getApiErrorMessage(error, "Could not load grades")}
      </p>
    );
  }

  if (!data) {
    return null;
  }

  const gradedStudents = data.students.filter(
    (student) => student.grade != null || student.comment,
  );

  const editHref = `/grades/by-course/add?yearId=${data.yearId}&classId=${data.classId}&sectionId=${data.sectionId}&courseId=${data.courseId}&gradeTypeId=${data.gradeTypeId}`;

  return (
    <div className="space-y-4">
      {showEditLink ? (
        <div className="flex justify-end">
          <Link
            href={editHref}
            className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-on-primary hover:bg-primary-hover"
          >
            <Pencil aria-hidden className="h-4 w-4" />
            Edit grades
          </Link>
        </div>
      ) : null}
      <article className="overflow-hidden rounded-2xl bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
      <div className="border-b border-stone-100 px-5 py-4">
        <h2 className="text-lg font-semibold text-foreground">
          {data.courseTitle}
        </h2>
        <p className="mt-1 text-sm text-muted">
          {data.yearTitle} · {data.className} · {data.sectionTitle} ·{" "}
          {data.gradeTypeTitle}
        </p>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-muted">
              Max grade
            </dt>
            <dd className="mt-1 font-medium text-foreground">{data.maxGrade}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-muted">
              Date
            </dt>
            <dd className="mt-1 font-medium text-foreground">
              {formatDate(data.publishDate)}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-muted">
              Created at
            </dt>
            <dd className="mt-1 font-medium text-foreground">
              {formatDateTime(data.createdAt)}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-muted">
              Students graded
            </dt>
            <dd className="mt-1 font-medium text-foreground">
              {gradedStudents.length} / {data.students.length}
            </dd>
          </div>
        </dl>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-stone-100 bg-stone-50/80">
            <tr>
              <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-muted">
                Student
              </th>
              <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-muted">
                Grade
              </th>
              <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-muted">
                Note
              </th>
            </tr>
          </thead>
          <tbody>
            {data.students.length === 0 ? (
              <tr>
                <td
                  colSpan={3}
                  className="px-5 py-10 text-center text-sm text-muted"
                >
                  No students in this section.
                </td>
              </tr>
            ) : (
              data.students.map((student) => (
                <tr
                  key={student.registrationId}
                  className="border-b border-stone-100 last:border-b-0 odd:bg-white even:bg-primary-soft/30"
                >
                  <td className="whitespace-nowrap px-5 py-4 font-medium text-foreground">
                    {student.studentName}
                  </td>
                  <td className="whitespace-nowrap px-5 py-4 text-foreground">
                    {student.grade != null ? student.grade : "—"}
                  </td>
                  <td className="px-5 py-4 text-foreground">
                    {student.comment?.trim() ? student.comment : "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </article>
    </div>
  );
}
