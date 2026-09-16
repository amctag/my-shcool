"use client";

import { useState } from "react";
import Link from "next/link";
import {
  GraduationCap,
  Users,
} from "lucide-react";
import { BackLink } from "@/components/dashboard/BackLink";
import { NameWithInitials } from "@/components/dashboard/NameWithInitials";
import { LoadingDots, TableLoadingRow } from "@/components/dashboard/TableLoading";
import { TablePagination } from "@/components/dashboard/TablePagination";
import { getApiErrorMessage } from "@/lib/getApiErrorMessage";
import { selectAuthReady, selectAccessToken } from "@/features/auth/authSlice";
import { useGetClassQuery } from "@/features/school/api/classesApi";
import { useGetStudentsQuery } from "@/features/school/api/studentsApi";
import { useAppSelector } from "@/store/hooks";

function formatBirthday(value?: string | null): string {
  if (!value) {
    return "—";
  }
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function ClassStudentsPage({ classId }: { classId: number }) {
  const ready = useAppSelector(selectAuthReady);
  const accessToken = useAppSelector(selectAccessToken);
  const canFetch = ready && Boolean(accessToken);
  const [page, setPage] = useState(1);
  const limit = 20;

  const {
    data: classItem,
    error: classError,
    isLoading: classLoading,
  } = useGetClassQuery(classId, { skip: !canFetch });

  const {
    data: studentsData,
    error: studentsError,
    isLoading: studentsLoading,
    isFetching,
  } = useGetStudentsQuery(
    { page, limit, classId, sortBy: "name", sortOrder: "asc" },
    { skip: !canFetch },
  );

  const students = studentsData?.items ?? [];
  const pagination = studentsData?.pagination;
  const totalPages = pagination?.totalPages ?? 0;
  const total = pagination?.total ?? 0;

  if (classLoading) {
    return (
      <div className="rounded-3xl bg-white p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <LoadingDots label="Loading class" />
      </div>
    );
  }

  if (classError || !classItem) {
    return (
      <div className="space-y-4">
        <BackLink href="/students">Back to students</BackLink>
        <p
          className="rounded-2xl bg-white px-5 py-8 text-center text-sm text-red-600 shadow-[0_8px_30px_rgb(0,0,0,0.04)]"
          role="alert"
        >
          {getApiErrorMessage(classError, "Could not load class")}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <BackLink href="/students">Back to students</BackLink>

      <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary to-primary-hover text-on-primary shadow-[0_12px_40px_rgba(234,88,12,0.25)]">
        <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div className="flex min-w-0 items-center gap-4">
            <div className="inline-flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/20 ring-4 ring-white/25 backdrop-blur-sm">
              <GraduationCap aria-hidden className="h-8 w-8" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/80">
                Class students
              </p>
              <h1 className="mt-1 truncate text-2xl font-semibold tracking-tight sm:text-3xl">
                {classItem.className}
              </h1>
              <p className="mt-1 text-sm text-white/85">
                {classItem.stageTitle}
                {classItem.classLevel
                  ? ` · Level ${classItem.classLevel}`
                  : ""}
              </p>
            </div>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-sm font-semibold text-white">
            <Users aria-hidden className="h-4 w-4" />
            {total} {total === 1 ? "student" : "students"}
          </div>
        </div>
      </section>

      <article className="overflow-hidden rounded-3xl bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-stone-200">
                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-muted">
                  ID
                </th>
                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-muted">
                  Student
                </th>
                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-muted">
                  Parent
                </th>
                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-muted">
                  Section
                </th>
                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-muted">
                  Year
                </th>
                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-muted">
                  Date of birth
                </th>
                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-muted">
                  Phone
                </th>
              </tr>
            </thead>
            <tbody>
              {studentsLoading ? (
                <TableLoadingRow colSpan={7} label="Loading students" />
              ) : studentsError ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-10 text-center text-sm text-red-600"
                    role="alert"
                  >
                    {getApiErrorMessage(
                      studentsError,
                      "Could not load students",
                    )}
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-10 text-center text-sm text-muted"
                  >
                    No students are registered in this class yet.
                  </td>
                </tr>
              ) : (
                students.map((student) => (
                  <tr
                    key={student.id}
                    className={`border-b border-stone-100 last:border-b-0 odd:bg-white even:bg-primary-soft/40 ${
                      isFetching ? "opacity-70" : ""
                    }`}
                  >
                    <td className="whitespace-nowrap px-5 py-4 font-semibold text-foreground">
                      {student.id}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 font-semibold text-foreground">
                      <Link
                        href={`/students/${student.id}`}
                        className="cursor-pointer transition-colors duration-200 hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                      >
                        <NameWithInitials
                          firstName={student.firstName}
                          lastName={student.lastName}
                          name={student.fullName}
                        />
                      </Link>
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-foreground">
                      {student.parentId && student.parentName ? (
                        <Link
                          href={`/parents/${student.parentId}`}
                          className="cursor-pointer font-medium text-primary underline-offset-2 transition-colors duration-200 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                        >
                          {student.parentName}
                        </Link>
                      ) : (
                        (student.parentName ?? "—")
                      )}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-foreground">
                      {student.sectionName ?? "—"}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-foreground">
                      {student.yearTitle ?? "—"}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-foreground">
                      {formatBirthday(student.birthday)}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 tabular-nums text-foreground">
                      {student.phoneNumber ?? "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {pagination && totalPages > 0 ? (
          <TablePagination
            page={page}
            totalPages={totalPages}
            total={pagination.total}
            label="students"
            disabled={isFetching}
            onPageChange={(next) => setPage(next)}
          />
        ) : null}
      </article>
    </div>
  );
}
