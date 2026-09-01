"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Eye,
  Plus,
} from "lucide-react";
import { FilterSelect } from "@/components/dashboard/FilterSelect";
import { TableLoadingRow } from "@/components/dashboard/TableLoading";
import { TableSearchBar } from "@/components/dashboard/TableSearchBar";
import { YearFilterSelect } from "@/components/dashboard/YearFilterSelect";
import { getApiErrorMessage } from "@/lib/getApiErrorMessage";
import { useGetClassesQuery } from "@/features/school/api/classesApi";
import {
  useGetDashboardGradeTypesListQuery,
  useGetGradesByCourseQuery,
} from "@/features/school/api/gradesApi";
import { useGetSectionsQuery } from "@/features/school/api/sectionsApi";
import { useGetClassCoursesQuery } from "@/features/school/api/coursesApi";
import { useSchoolYearFilter } from "@/features/school/useSchoolYearFilter";
import { selectAuthReady, selectAccessToken } from "@/features/auth/authSlice";
import { useAppSelector } from "@/store/hooks";
import type {
  DashboardGradesByCourseQuery,
  GradesByCourseSortBy,
  GradesByCourseSortOrder,
} from "@/features/school/types";

const PAGE_SIZE = 10;

function buildQuery(
  page: number,
  appliedSearch: string,
  appliedYearId: number | null,
  appliedClassId: number,
  appliedSectionId: number,
  appliedCourseId: number,
  appliedGradeTypeId: number,
  sortBy: GradesByCourseSortBy,
  sortOrder: GradesByCourseSortOrder,
): DashboardGradesByCourseQuery {
  const query: DashboardGradesByCourseQuery = {
    page,
    limit: PAGE_SIZE,
    sortBy,
    sortOrder,
  };
  if (appliedSearch) query.search = appliedSearch;
  if (appliedYearId) query.yearId = appliedYearId;
  if (appliedClassId) query.classId = appliedClassId;
  if (appliedSectionId) query.sectionId = appliedSectionId;
  if (appliedCourseId) query.courseId = appliedCourseId;
  if (appliedGradeTypeId) query.gradeTypeId = appliedGradeTypeId;
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
  column: GradesByCourseSortBy;
  sortBy: GradesByCourseSortBy;
  sortOrder: GradesByCourseSortOrder;
  onSort: (column: GradesByCourseSortBy) => void;
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

export function GradesByCourseTable() {
  const ready = useAppSelector(selectAuthReady);
  const accessToken = useAppSelector(selectAccessToken);
  const canFetch = ready && Boolean(accessToken);
  const { years, yearId: defaultYearId } = useSchoolYearFilter(canFetch);

  const [searchInput, setSearchInput] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [draftClassId, setDraftClassId] = useState(0);
  const [draftSectionId, setDraftSectionId] = useState(0);
  const [draftCourseId, setDraftCourseId] = useState(0);
  const [draftGradeTypeId, setDraftGradeTypeId] = useState(0);
  const [appliedClassId, setAppliedClassId] = useState(0);
  const [appliedSectionId, setAppliedSectionId] = useState(0);
  const [appliedCourseId, setAppliedCourseId] = useState(0);
  const [appliedGradeTypeId, setAppliedGradeTypeId] = useState(0);
  const [draftYearId, setDraftYearId] = useState<number | null>(null);
  const [appliedYearId, setAppliedYearId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<GradesByCourseSortBy>("id");
  const [sortOrder, setSortOrder] = useState<GradesByCourseSortOrder>("desc");

  const resolvedYearId = appliedYearId ?? defaultYearId;
  const draftResolvedYearId = draftYearId ?? defaultYearId;

  const { data: classesData } = useGetClassesQuery(
    { page: 1, limit: 100, sortOrder: "asc" },
    { skip: !canFetch },
  );
  const classes = classesData?.items ?? [];

  const { data: sectionsData } = useGetSectionsQuery(
    {
      page: 1,
      limit: 100,
      classId: draftClassId > 0 ? draftClassId : undefined,
      yearId: draftResolvedYearId ?? undefined,
      sortBy: "section",
      sortOrder: "asc",
    },
    { skip: !canFetch || !draftResolvedYearId || draftClassId <= 0 },
  );
  const sections = sectionsData?.items ?? [];

  const { data: classCoursesData } = useGetClassCoursesQuery(
    {
      page: 1,
      limit: 100,
      classId: draftClassId > 0 ? draftClassId : undefined,
      yearId: draftResolvedYearId ?? undefined,
      status: "active",
      sortBy: "course",
      sortOrder: "asc",
    },
    { skip: !canFetch || !draftResolvedYearId || draftClassId <= 0 },
  );
  const courses = classCoursesData?.items ?? [];

  const { data: gradeTypesData } = useGetDashboardGradeTypesListQuery(undefined, {
    skip: !canFetch,
  });
  const gradeTypes = gradeTypesData?.items ?? [];

  const { data, error, isLoading, isFetching } = useGetGradesByCourseQuery(
    buildQuery(
      page,
      appliedSearch,
      resolvedYearId,
      appliedClassId,
      appliedSectionId,
      appliedCourseId,
      appliedGradeTypeId,
      sortBy,
      sortOrder,
    ),
    { skip: !canFetch || !resolvedYearId },
  );

  const items = data?.items ?? [];
  const pagination = data?.pagination;
  const totalPages = pagination?.totalPages ?? 0;

  function applySearch() {
    const next = searchInput.trim();
    const nextYearId = draftYearId ?? defaultYearId;
    if (
      next === appliedSearch &&
      nextYearId === appliedYearId &&
      draftClassId === appliedClassId &&
      draftSectionId === appliedSectionId &&
      draftCourseId === appliedCourseId &&
      draftGradeTypeId === appliedGradeTypeId
    ) {
      return;
    }
    setPage(1);
    setAppliedSearch(next);
    setAppliedYearId(nextYearId);
    setAppliedClassId(draftClassId);
    setAppliedSectionId(draftSectionId);
    setAppliedCourseId(draftCourseId);
    setAppliedGradeTypeId(draftGradeTypeId);
  }

  function handleSort(column: GradesByCourseSortBy) {
    setPage(1);
    if (sortBy === column) {
      setSortOrder((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }
    setSortBy(column);
    setSortOrder("asc");
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
        <TableSearchBar
          label="Search grades by course"
          placeholder="Search year, course, section, or type"
          value={searchInput}
          onChange={setSearchInput}
          onSearch={applySearch}
          compact
        >
          <YearFilterSelect
            years={years}
            value={draftYearId ?? defaultYearId}
            onChange={(yearId) => {
              setDraftYearId(yearId);
              setDraftSectionId(0);
              setDraftCourseId(0);
            }}
          />
          <FilterSelect
            label="Class"
            value={draftClassId}
            options={[
              { value: 0, label: "All classes" },
              ...classes.map((item) => ({
                value: item.id,
                label: item.className,
              })),
            ]}
            onChange={(value) => {
              setDraftClassId(value);
              setDraftSectionId(0);
              setDraftCourseId(0);
            }}
          />
          <FilterSelect
            label="Section"
            value={draftSectionId}
            options={[
              { value: 0, label: "All sections" },
              ...sections.map((item) => ({
                value: item.id,
                label: item.sectionTitle,
              })),
            ]}
            onChange={setDraftSectionId}
          />
          <FilterSelect
            label="Course"
            value={draftCourseId}
            options={[
              { value: 0, label: "All courses" },
              ...courses.map((item) => ({
                value: item.courseId,
                label: item.courseTitle,
              })),
            ]}
            onChange={setDraftCourseId}
          />
          <FilterSelect
            label="Grade type"
            value={draftGradeTypeId}
            options={[
              { value: 0, label: "All types" },
              ...gradeTypes.map((item) => ({
                value: item.id,
                label: item.title,
              })),
            ]}
            onChange={setDraftGradeTypeId}
          />
        </TableSearchBar>
        <Link
          href="/grades/by-course/add"
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
                <SortHeader
                  label="Grade type"
                  column="gradeType"
                  sortBy={sortBy}
                  sortOrder={sortOrder}
                  onSort={handleSort}
                />
                <SortHeader
                  label="Course"
                  column="course"
                  sortBy={sortBy}
                  sortOrder={sortOrder}
                  onSort={handleSort}
                />
                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-muted">
                  Class
                </th>
                <SortHeader
                  label="Section"
                  column="section"
                  sortBy={sortBy}
                  sortOrder={sortOrder}
                  onSort={handleSort}
                />
                <SortHeader
                  label="Max grade"
                  column="maxGrade"
                  sortBy={sortBy}
                  sortOrder={sortOrder}
                  onSort={handleSort}
                />
                <SortHeader
                  label="Year"
                  column="year"
                  sortBy={sortBy}
                  sortOrder={sortOrder}
                  onSort={handleSort}
                />
                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-muted">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading || !resolvedYearId ? (
                <TableLoadingRow colSpan={7} label="Loading grades" />
              ) : error ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-10 text-center text-sm text-red-600"
                    role="alert"
                  >
                    {getApiErrorMessage(error, "Could not load grades")}
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-10 text-center text-sm text-muted"
                  >
                    No grades found. Click Add to create one.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr
                    key={item.id}
                    className={`border-b border-stone-100 last:border-b-0 odd:bg-white even:bg-primary-soft/50 ${isFetching ? "opacity-70" : ""}`}
                  >
                    <td className="whitespace-nowrap px-5 py-4 text-foreground">
                      {item.gradeTypeTitle}
                    </td>
                    <td className="px-5 py-4 font-medium text-foreground">
                      {item.courseTitle}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-foreground">
                      {item.className}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-foreground">
                      {item.sectionTitle}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-foreground">
                      {item.maxGrade}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-foreground">
                      {item.yearTitle}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4">
                      <Link
                        href={`/grades/by-course/view?gradeId=${item.id}`}
                        className="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl border border-border bg-white text-foreground transition-colors hover:bg-primary-soft hover:text-primary"
                        aria-label={`View grades for ${item.courseTitle}`}
                        title="View"
                      >
                        <Eye aria-hidden className="h-4 w-4" />
                      </Link>
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
              Page {pagination.page} of {totalPages} · {pagination.total} grade
              {pagination.total === 1 ? "" : "s"}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={page <= 1 || isFetching}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                className="inline-flex h-11 cursor-pointer items-center gap-1 rounded-xl border border-border px-3 text-sm font-medium hover:bg-primary-soft disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Previous page"
              >
                <ChevronLeft aria-hidden className="h-4 w-4" />
                Previous
              </button>
              <button
                type="button"
                disabled={page >= totalPages || isFetching}
                onClick={() =>
                  setPage((current) => Math.min(totalPages, current + 1))
                }
                className="inline-flex h-11 cursor-pointer items-center gap-1 rounded-xl border border-border px-3 text-sm font-medium hover:bg-primary-soft disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Next page"
              >
                Next
                <ChevronRight aria-hidden className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : null}
      </article>
    </div>
  );
}
