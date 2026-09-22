"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ChevronDown,
  ChevronUp,
  Eye,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { ConfirmDeleteDialog } from "@/components/dashboard/ConfirmDeleteDialog";
import { FilterSelect } from "@/components/dashboard/FilterSelect";
import { TableLoadingRow } from "@/components/dashboard/TableLoading";
import { TablePagination } from "@/components/dashboard/TablePagination";
import { TableSearchBar } from "@/components/dashboard/TableSearchBar";
import { getApiErrorMessage } from "@/lib/getApiErrorMessage";
import { useGetClassesQuery } from "@/features/school/api/classesApi";
import {
  useDeleteClassCourseMutation,
  useGetClassCoursesQuery,
  useGetCoursesQuery,
} from "@/features/school/api/coursesApi";
import { useSchoolYearFilter } from "@/features/school/useSchoolYearFilter";
import { selectAuthReady, selectAccessToken } from "@/features/auth/authSlice";
import { useAppSelector } from "@/store/hooks";
import type {
  ClassCoursesSortBy,
  ClassCoursesSortOrder,
  DashboardClassCoursesQuery,
} from "@/features/school/types";

type ClassCourseStatusFilter = "all" | "active" | "inactive";

type ClassCourseFilters = {
  classId: number;
  courseId: number;
  status: ClassCourseStatusFilter;
};

const emptyFilters: ClassCourseFilters = {
  classId: 0,
  courseId: 0,
  status: "all",
};

function filtersEqual(
  left: ClassCourseFilters,
  right: ClassCourseFilters,
): boolean {
  return (
    left.classId === right.classId &&
    left.courseId === right.courseId &&
    left.status === right.status
  );
}

function buildQuery(
  page: number,
  limit: number,
  sortBy: ClassCoursesSortBy,
  sortOrder: ClassCoursesSortOrder,
  yearId: number | null | undefined,
  filters: ClassCourseFilters,
): DashboardClassCoursesQuery {
  const query: DashboardClassCoursesQuery = { page, limit, sortBy, sortOrder };
  if (yearId) {
    query.yearId = yearId;
  }
  if (filters.classId) {
    query.classId = filters.classId;
  }
  if (filters.courseId) {
    query.courseId = filters.courseId;
  }
  if (filters.status !== "all") {
    query.status = filters.status;
  }
  return query;
}

function SortHeader({
  label,
  column,
  sortBy,
  sortOrder,
  onSort,
}: {
  label: string;
  column: ClassCoursesSortBy;
  sortBy: ClassCoursesSortBy;
  sortOrder: ClassCoursesSortOrder;
  onSort: (column: ClassCoursesSortBy) => void;
}) {
  const active = sortBy === column;
  return (
    <th className="px-5 py-3.5">
      <button
        type="button"
        onClick={() => onSort(column)}
        className="inline-flex min-h-11 cursor-pointer items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted hover:text-foreground"
      >
        {label}
        <span className="inline-flex flex-col -space-y-1" aria-hidden>
          <ChevronUp
            className={`h-3 w-3 ${active && sortOrder === "asc" ? "text-primary" : "text-muted/40"}`}
          />
          <ChevronDown
            className={`h-3 w-3 ${active && sortOrder === "desc" ? "text-primary" : "text-muted/40"}`}
          />
        </span>
      </button>
    </th>
  );
}

export function ClassCoursesTable() {
  const ready = useAppSelector(selectAuthReady);
  const accessToken = useAppSelector(selectAccessToken);
  const [draftFilters, setDraftFilters] = useState<ClassCourseFilters>(emptyFilters);
  const [appliedFilters, setAppliedFilters] =
    useState<ClassCourseFilters>(emptyFilters);
  const [page, setPage] = useState(1);

  const [sortBy, setSortBy] = useState<ClassCoursesSortBy>("id");
  const [sortOrder, setSortOrder] = useState<ClassCoursesSortOrder>("asc");
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<{
    id: number;
    label: string;
  } | null>(null);
  const limit = 10;
  const canFetch = ready && Boolean(accessToken);
  const { yearId } = useSchoolYearFilter(canFetch);
  useEffect(() => {
    setPage(1);
  }, [yearId]);

  const query = buildQuery(
    page,
    limit,
    sortBy,
    sortOrder,
    yearId,
    appliedFilters,
  );
  const { data, error, isLoading, isFetching } = useGetClassCoursesQuery(query, {
    skip: !canFetch || !yearId,
  });
  const { data: classesData } = useGetClassesQuery(
    { page: 1, limit: 20 },
    { skip: !canFetch },
  );
  const { data: courses = [] } = useGetCoursesQuery(undefined, {
    skip: !canFetch,
  });
  const classes = classesData?.items ?? [];
  const [deleteClassCourse, deleteState] = useDeleteClassCourseMutation();

  function applySearch() {
    if (filtersEqual(draftFilters, appliedFilters)) {
      return;
    }
    setPage(1);
    setAppliedFilters(draftFilters);
  }

  function onSort(column: ClassCoursesSortBy) {
    setPage(1);
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
      return;
    }
    setSortBy(column);
    setSortOrder("asc");
  }

  const items = data?.items ?? [];
  const pagination = data?.pagination;
  const totalPages = pagination?.totalPages ?? 0;

  async function confirmDelete() {
    if (!pendingDelete) {
      return;
    }
    setDeleteError(null);
    try {
      await deleteClassCourse(pendingDelete.id).unwrap();
      setPendingDelete(null);
    } catch (caught) {
      setDeleteError(getApiErrorMessage(caught, "Could not remove class course"));
    }
  }

  return (
    <>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <TableSearchBar onSearch={applySearch} compact hideInput>
          <FilterSelect
            label="Filter by class"
            value={draftFilters.classId}
            options={[
              { value: 0, label: "All classes" },
              ...classes.map((itemClass) => ({
                value: itemClass.id,
                label: itemClass.className,
              })),
            ]}
            onChange={(classId) =>
              setDraftFilters((current) => ({ ...current, classId }))
            }
          />
          <FilterSelect
            label="Filter by course"
            value={draftFilters.courseId}
            options={[
              { value: 0, label: "All courses" },
              ...courses.map((course) => ({
                value: course.id,
                label: course.title,
              })),
            ]}
            onChange={(courseId) =>
              setDraftFilters((current) => ({ ...current, courseId }))
            }
          />
          <FilterSelect
            label="Filter by status"
            value={draftFilters.status}
            options={[
              { value: "all", label: "All statuses" },
              { value: "active", label: "Active" },
              { value: "inactive", label: "Inactive" },
            ]}
            onChange={(status) =>
              setDraftFilters((current) => ({ ...current, status }))
            }
          />
        </TableSearchBar>
        <Link
          href="/class-courses/add"
          className="inline-flex h-11 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-on-primary hover:bg-primary-hover"
        >
          <Plus aria-hidden className="h-4 w-4" />
          Add
        </Link>
      </div>
      <article className="overflow-hidden rounded-2xl bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-stone-200">
                <SortHeader label="ID" column="id" sortBy={sortBy} sortOrder={sortOrder} onSort={onSort} />
                <SortHeader label="Class" column="class" sortBy={sortBy} sortOrder={sortOrder} onSort={onSort} />
                <SortHeader label="Course" column="course" sortBy={sortBy} sortOrder={sortOrder} onSort={onSort} />
                <SortHeader label="Hours" column="hours" sortBy={sortBy} sortOrder={sortOrder} onSort={onSort} />
                <SortHeader label="Year" column="year" sortBy={sortBy} sortOrder={sortOrder} onSort={onSort} />
                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-muted">
                  Status
                </th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-muted">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading || !yearId ? (
                <TableLoadingRow colSpan={7} label="Loading class courses" />
              ) : error ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-sm text-red-600" role="alert">
                    {getApiErrorMessage(error, "Could not load class courses")}
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-sm text-muted">
                    No class courses for this year.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr
                    key={item.id}
                    className={`border-b border-stone-100 last:border-b-0 ${isFetching ? "opacity-70" : ""}`}
                  >
                    <td className="whitespace-nowrap px-5 py-4 font-semibold">{item.id}</td>
                    <td className="whitespace-nowrap px-5 py-4 font-semibold">{item.className}</td>
                    <td className="whitespace-nowrap px-5 py-4">{item.courseTitle}</td>
                    <td className="whitespace-nowrap px-5 py-4 tabular-nums">
                      {item.numberOfHours ?? "—"}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4">{item.yearTitle}</td>
                    <td className="whitespace-nowrap px-5 py-4">
                      {item.status ? "Active" : "Inactive"}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/class-courses/${item.id}`}
                          aria-label="View"
                          className="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl border border-border bg-white hover:bg-primary-soft hover:text-primary"
                        >
                          <Eye aria-hidden className="h-4 w-4" />
                        </Link>
                        <Link
                          href={`/class-courses/${item.id}/edit`}
                          aria-label="Edit"
                          className="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl border border-border bg-white hover:bg-primary-soft hover:text-primary"
                        >
                          <Pencil aria-hidden className="h-4 w-4" />
                        </Link>
                        <button
                          type="button"
                          aria-label="Delete"
                          disabled={deleteState.isLoading}
                          onClick={() => {
                            setDeleteError(null);
                            setPendingDelete({
                              id: item.id,
                              label: `${item.className} / ${item.courseTitle}`,
                            });
                          }}
                          className="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl border border-red-200 bg-white text-red-600 hover:bg-red-50 disabled:opacity-40"
                        >
                          <Trash2 aria-hidden className="h-4 w-4" />
                        </button>
                      </div>
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
            label="class courses"
            disabled={isFetching}
            onPageChange={(next) => setPage(next)}
          />
        ) : null}
      </article>
      {pendingDelete ? (
        <ConfirmDeleteDialog
          title="Remove class course"
          description={`Remove ${pendingDelete.label} from this year?`}
          error={deleteError}
          busy={deleteState.isLoading}
          onCancel={() => {
            setPendingDelete(null);
            setDeleteError(null);
          }}
          onConfirm={() => void confirmDelete()}
        />
      ) : null}
    </>
  );
}
