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
import { FilterSelect } from "@/components/dashboard/FilterSelect";
import { TableLoadingRow } from "@/components/dashboard/TableLoading";
import { TableSearchBar } from "@/components/dashboard/TableSearchBar";
import { YearFilterSelect } from "@/components/dashboard/YearFilterSelect";
import { getApiErrorMessage } from "@/lib/getApiErrorMessage";
import { useGetClassesQuery } from "@/features/school/api/classesApi";
import { useGetCoursesQuery } from "@/features/school/api/coursesApi";
import { useGetSectionsQuery } from "@/features/school/api/sectionsApi";
import { useGetTeachersQuery } from "@/features/school/api/teachersApi";
import {
  teachesApi,
  useDeleteTeachMutation,
  useGetTeachesQuery,
} from "@/features/school/api/teachesApi";
import { useSchoolYearFilter } from "@/features/school/useSchoolYearFilter";
import { selectAuthReady, selectAccessToken } from "@/features/auth/authSlice";
import { useAppSelector } from "@/store/hooks";
import type {
  DashboardTeachesQuery,
  TeachesSortBy,
  TeachesSortOrder,
} from "@/features/school/types";

type TeachFilters = {
  classId: number;
  sectionId: number;
  courseId: number;
  teacherId: number;
};

const emptyFilters: TeachFilters = {
  classId: 0,
  sectionId: 0,
  courseId: 0,
  teacherId: 0,
};

function filtersEqual(left: TeachFilters, right: TeachFilters): boolean {
  return (
    left.classId === right.classId &&
    left.sectionId === right.sectionId &&
    left.courseId === right.courseId &&
    left.teacherId === right.teacherId
  );
}

function buildQuery(
  page: number,
  limit: number,
  appliedSearch: string,
  sortBy: TeachesSortBy,
  sortOrder: TeachesSortOrder,
  yearId: number | null | undefined,
  filters: TeachFilters,
): DashboardTeachesQuery {
  const query: DashboardTeachesQuery = { page, limit, sortBy, sortOrder };
  if (appliedSearch) {
    query.search = appliedSearch;
  }
  if (yearId) {
    query.yearId = yearId;
  }
  if (filters.classId) {
    query.classId = filters.classId;
  }
  if (filters.sectionId) {
    query.sectionId = filters.sectionId;
  }
  if (filters.courseId) {
    query.courseId = filters.courseId;
  }
  if (filters.teacherId) {
    query.teacherId = filters.teacherId;
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
  column: TeachesSortBy;
  sortBy: TeachesSortBy;
  sortOrder: TeachesSortOrder;
  onSort: (column: TeachesSortBy) => void;
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

export function TeachesTable() {
  const ready = useAppSelector(selectAuthReady);
  const accessToken = useAppSelector(selectAccessToken);
  const [searchInput, setSearchInput] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [draftFilters, setDraftFilters] = useState<TeachFilters>(emptyFilters);
  const [appliedFilters, setAppliedFilters] = useState<TeachFilters>(emptyFilters);
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<TeachesSortBy>("id");
  const [sortOrder, setSortOrder] = useState<TeachesSortOrder>("asc");
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<{
    id: number;
    label: string;
  } | null>(null);
  const limit = 10;
  const prefetch = teachesApi.usePrefetch("getTeaches");
  const canFetch = ready && Boolean(accessToken);
  const { years, yearId, setYearId } = useSchoolYearFilter(canFetch);
  const query = buildQuery(
    page,
    limit,
    appliedSearch,
    sortBy,
    sortOrder,
    yearId,
    appliedFilters,
  );
  const { data, error, isLoading, isFetching } = useGetTeachesQuery(query, {
    skip: !canFetch || !yearId,
  });
  const { data: classes = [] } = useGetClassesQuery(undefined, {
    skip: !canFetch,
  });
  const { data: courses = [] } = useGetCoursesQuery(undefined, {
    skip: !canFetch,
  });
  const { data: teachersData } = useGetTeachersQuery(
    { page: 1, limit: 100, sortBy: "name", sortOrder: "asc" },
    { skip: !canFetch },
  );
  const { data: sectionsData } = useGetSectionsQuery(
    {
      page: 1,
      limit: 100,
      classId: draftFilters.classId,
      yearId: yearId ?? 0,
      sortBy: "section",
      sortOrder: "asc",
    },
    { skip: !canFetch || !draftFilters.classId || !yearId },
  );
  const [deleteTeach, deleteState] = useDeleteTeachMutation();
  const teachers = teachersData?.items ?? [];
  const sections = sectionsData?.items ?? [];

  function applySearch() {
    const next = searchInput.trim();
    if (next === appliedSearch) {
      return;
    }
    setPage(1);
    setAppliedSearch(next);
  }

  function applyFilters() {
    if (filtersEqual(draftFilters, appliedFilters)) {
      return;
    }
    setPage(1);
    setAppliedFilters(draftFilters);
  }

  useEffect(() => {
    const totalPages = data?.pagination.totalPages ?? 0;
    if (!canFetch || totalPages < page + 1) {
      return;
    }
    prefetch(
      buildQuery(
        page + 1,
        limit,
        appliedSearch,
        sortBy,
        sortOrder,
        yearId,
        appliedFilters,
      ),
    );
  }, [
    appliedFilters,
    appliedSearch,
    canFetch,
    data?.pagination.totalPages,
    page,
    prefetch,
    sortBy,
    sortOrder,
    yearId,
  ]);

  function onSort(column: TeachesSortBy) {
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
      await deleteTeach(pendingDelete.id).unwrap();
      setPendingDelete(null);
    } catch (caught) {
      setDeleteError(getApiErrorMessage(caught, "Could not remove teach"));
    }
  }

  return (
    <>
      <div className="mb-5 flex flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex w-full min-w-0 flex-col gap-3 sm:flex-row sm:items-center">
            <TableSearchBar
              label="Search teach"
              placeholder="Search by teacher, class, section, or course"
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
                setDraftFilters((current) => ({ ...current, sectionId: 0 }));
                setAppliedFilters((current) => ({ ...current, sectionId: 0 }));
              }}
            />
          </div>
          <Link
            href="/teaches/add"
            className="inline-flex h-11 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-on-primary hover:bg-primary-hover"
          >
            <Plus aria-hidden className="h-4 w-4" />
            Add
          </Link>
        </div>
        <form
          className="flex flex-wrap items-center gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            applyFilters();
          }}
        >
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
              setDraftFilters((current) => ({
                ...current,
                classId,
                sectionId: 0,
              }))
            }
          />
          <FilterSelect
            label="Filter by section"
            value={draftFilters.sectionId}
            disabled={!draftFilters.classId}
            options={[
              { value: 0, label: draftFilters.classId ? "All sections" : "Choose class first" },
              ...sections.map((section) => ({
                value: section.id,
                label: section.sectionTitle,
              })),
            ]}
            onChange={(sectionId) =>
              setDraftFilters((current) => ({ ...current, sectionId }))
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
            label="Filter by teacher"
            value={draftFilters.teacherId}
            options={[
              { value: 0, label: "All teachers" },
              ...teachers.map((teacher) => ({
                value: teacher.id,
                label:
                  `${teacher.firstName ?? ""} ${teacher.lastName ?? ""}`.trim() ||
                  teacher.fullName,
              })),
            ]}
            onChange={(teacherId) =>
              setDraftFilters((current) => ({ ...current, teacherId }))
            }
          />
          <button
            type="submit"
            className="inline-flex h-11 shrink-0 cursor-pointer items-center justify-center rounded-lg bg-foreground px-4 text-sm font-medium text-white transition-colors duration-200 hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            Filter
          </button>
        </form>
      </div>
      <article className="overflow-hidden rounded-2xl bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-stone-200">
                <SortHeader label="ID" column="id" sortBy={sortBy} sortOrder={sortOrder} onSort={onSort} />
                <SortHeader label="Teacher" column="teacher" sortBy={sortBy} sortOrder={sortOrder} onSort={onSort} />
                <SortHeader label="Class" column="class" sortBy={sortBy} sortOrder={sortOrder} onSort={onSort} />
                <SortHeader label="Section" column="section" sortBy={sortBy} sortOrder={sortOrder} onSort={onSort} />
                <SortHeader label="Course" column="course" sortBy={sortBy} sortOrder={sortOrder} onSort={onSort} />
                <SortHeader label="Year" column="year" sortBy={sortBy} sortOrder={sortOrder} onSort={onSort} />
                <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-muted">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading || !yearId ? (
                <TableLoadingRow colSpan={7} label="Loading teach" />
              ) : error ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-sm text-red-600" role="alert">
                    {getApiErrorMessage(error, "Could not load teach")}
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-sm text-muted">
                    No teach assignments for this year.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr
                    key={item.id}
                    className={`border-b border-stone-100 last:border-b-0 ${isFetching ? "opacity-70" : ""}`}
                  >
                    <td className="whitespace-nowrap px-5 py-4 font-semibold">{item.id}</td>
                    <td className="whitespace-nowrap px-5 py-4 font-semibold">{item.teacherName}</td>
                    <td className="whitespace-nowrap px-5 py-4">{item.className}</td>
                    <td className="whitespace-nowrap px-5 py-4">{item.sectionTitle}</td>
                    <td className="whitespace-nowrap px-5 py-4">{item.courseTitle}</td>
                    <td className="whitespace-nowrap px-5 py-4">{item.yearTitle}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/teaches/${item.id}`}
                          aria-label="View"
                          className="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl border border-border bg-white hover:bg-primary-soft hover:text-primary"
                        >
                          <Eye aria-hidden className="h-4 w-4" />
                        </Link>
                        <Link
                          href={`/teaches/${item.id}/edit`}
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
                              label: `${item.teacherName} — ${item.className} ${item.sectionTitle} / ${item.courseTitle}`,
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
              Page {pagination.page} of {totalPages} · {pagination.total} assignments
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
          title="Remove teach"
          description={`Remove ${pendingDelete.label}?`}
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
