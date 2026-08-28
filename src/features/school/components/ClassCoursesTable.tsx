"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Eye,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { ConfirmDeleteDialog } from "@/components/dashboard/ConfirmDeleteDialog";
import { TableLoadingRow } from "@/components/dashboard/TableLoading";
import { TableSearchBar } from "@/components/dashboard/TableSearchBar";
import { YearFilterSelect } from "@/components/dashboard/YearFilterSelect";
import { getApiErrorMessage } from "@/lib/getApiErrorMessage";
import {
  coursesApi,
  useDeleteClassCourseMutation,
  useGetClassCoursesQuery,
} from "@/features/school/api/coursesApi";
import { useSchoolYearFilter } from "@/features/school/useSchoolYearFilter";
import { selectAuthReady, selectAccessToken } from "@/features/auth/authSlice";
import { useAppSelector } from "@/store/hooks";
import type {
  ClassCoursesSortBy,
  ClassCoursesSortOrder,
  DashboardClassCoursesQuery,
} from "@/features/school/types";

function buildQuery(
  page: number,
  limit: number,
  appliedSearch: string,
  sortBy: ClassCoursesSortBy,
  sortOrder: ClassCoursesSortOrder,
  yearId?: number | null,
): DashboardClassCoursesQuery {
  const query: DashboardClassCoursesQuery = { page, limit, sortBy, sortOrder };
  if (appliedSearch) {
    query.search = appliedSearch;
  }
  if (yearId) {
    query.yearId = yearId;
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
  const [searchInput, setSearchInput] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<ClassCoursesSortBy>("id");
  const [sortOrder, setSortOrder] = useState<ClassCoursesSortOrder>("asc");
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<{
    id: number;
    label: string;
  } | null>(null);
  const limit = 10;
  const prefetch = coursesApi.usePrefetch("getClassCourses");
  const canFetch = ready && Boolean(accessToken);
  const { years, yearId, setYearId } = useSchoolYearFilter(canFetch);
  const query = buildQuery(page, limit, appliedSearch, sortBy, sortOrder, yearId);
  const { data, error, isLoading, isFetching } = useGetClassCoursesQuery(query, {
    skip: !canFetch || !yearId,
  });
  const [deleteClassCourse, deleteState] = useDeleteClassCourseMutation();

  function applySearch() {
    const next = searchInput.trim();
    if (next === appliedSearch) {
      return;
    }
    setPage(1);
    setAppliedSearch(next);
  }

  useEffect(() => {
    const totalPages = data?.pagination.totalPages ?? 0;
    if (!canFetch || totalPages < page + 1) {
      return;
    }
    prefetch(buildQuery(page + 1, limit, appliedSearch, sortBy, sortOrder, yearId));
  }, [
    appliedSearch,
    canFetch,
    data?.pagination.totalPages,
    page,
    prefetch,
    sortBy,
    sortOrder,
    yearId,
  ]);

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
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex w-full min-w-0 flex-col gap-3 sm:flex-row sm:items-center">
          <TableSearchBar
            label="Search class courses"
            placeholder="Search by class or course"
            value={searchInput}
            onChange={setSearchInput}
            onSearch={applySearch}
          />
          <YearFilterSelect
            years={years}
            value={yearId}
            onChange={(nextYearId) => {
              setPage(1);
              setYearId(nextYearId);
            }}
          />
        </div>
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
          <div className="flex items-center justify-between gap-3 border-t border-stone-100 px-5 py-4">
            <p className="text-sm text-muted">
              Page {pagination.page} of {totalPages} · {pagination.total} class courses
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={page <= 1 || isFetching}
                onClick={() => setPage(page - 1)}
                className="inline-flex h-11 cursor-pointer items-center gap-1 rounded-xl border border-border px-3 text-sm font-medium hover:bg-primary-soft disabled:opacity-50"
              >
                <ChevronLeft aria-hidden className="h-4 w-4" />
                Previous
              </button>
              <button
                type="button"
                disabled={page >= totalPages || isFetching}
                onClick={() => setPage(page + 1)}
                className="inline-flex h-11 cursor-pointer items-center gap-1 rounded-xl border border-border px-3 text-sm font-medium hover:bg-primary-soft disabled:opacity-50"
              >
                Next
                <ChevronRight aria-hidden className="h-4 w-4" />
              </button>
            </div>
          </div>
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
