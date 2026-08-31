"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
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
import { useGetSectionsQuery } from "@/features/school/api/sectionsApi";
import {
  useDeleteDashboardWeeklyScheduleMutation,
  useGetDashboardWeeklySchedulesQuery,
} from "@/features/school/api/weeklySchedulesApi";
import { useSchoolYearFilter } from "@/features/school/useSchoolYearFilter";
import { selectAuthReady, selectAccessToken } from "@/features/auth/authSlice";
import { useAppSelector } from "@/store/hooks";
import type {
  DashboardWeeklySchedulesQuery,
  WeeklySchedulesSortBy,
  WeeklySchedulesSortOrder,
} from "@/features/school/types";

const PAGE_SIZE = 10;

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(new Date(value));
}

function buildQuery(
  page: number,
  appliedSearch: string,
  appliedYearId: number | null,
  appliedClassId: number,
  appliedSectionId: number,
  sortBy: WeeklySchedulesSortBy,
  sortOrder: WeeklySchedulesSortOrder,
): DashboardWeeklySchedulesQuery {
  const query: DashboardWeeklySchedulesQuery = {
    page,
    limit: PAGE_SIZE,
    sortBy,
    sortOrder,
  };
  if (appliedSearch) {
    query.search = appliedSearch;
  }
  if (appliedYearId) {
    query.yearId = appliedYearId;
  }
  if (appliedClassId) {
    query.classId = appliedClassId;
  }
  if (appliedSectionId) {
    query.sectionId = appliedSectionId;
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
  column: WeeklySchedulesSortBy;
  sortBy: WeeklySchedulesSortBy;
  sortOrder: WeeklySchedulesSortOrder;
  onSort: (column: WeeklySchedulesSortBy) => void;
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

export function WeeklySchedulesTable() {
  const searchParams = useSearchParams();
  const ready = useAppSelector(selectAuthReady);
  const accessToken = useAppSelector(selectAccessToken);
  const canFetch = ready && Boolean(accessToken);
  const [searchInput, setSearchInput] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [draftYearId, setDraftYearId] = useState<number | null>(null);
  const [appliedYearId, setAppliedYearId] = useState<number | null>(null);
  const [draftClassId, setDraftClassId] = useState(0);
  const [appliedClassId, setAppliedClassId] = useState(0);
  const [draftSectionId, setDraftSectionId] = useState(0);
  const [appliedSectionId, setAppliedSectionId] = useState(0);
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<WeeklySchedulesSortBy>("id");
  const [sortOrder, setSortOrder] = useState<WeeklySchedulesSortOrder>("asc");
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<{
    id: number;
    label: string;
  } | null>(null);
  const { years, yearId: defaultYearId } = useSchoolYearFilter(canFetch);

  const query = buildQuery(
    page,
    appliedSearch,
    appliedYearId,
    appliedClassId,
    appliedSectionId,
    sortBy,
    sortOrder,
  );

  const { data, error, isLoading, isFetching } =
    useGetDashboardWeeklySchedulesQuery(query, {
      skip: !canFetch || !appliedYearId,
    });

  const [deleteSchedule, deleteState] =
    useDeleteDashboardWeeklyScheduleMutation();

  const { data: classesData } = useGetClassesQuery(
    { page: 1, limit: 100, sortOrder: "asc" },
    { skip: !canFetch },
  );
  const classes = classesData?.items ?? [];
  const classSelected = draftClassId > 0;

  const { data: sectionsData, isFetching: sectionsLoading } = useGetSectionsQuery(
    {
      page: 1,
      limit: 100,
      yearId: draftYearId ?? undefined,
      classId: draftClassId,
      sortBy: "section",
      sortOrder: "asc",
    },
    { skip: !canFetch || !draftYearId || !classSelected },
  );
  const sections = sectionsData?.items ?? [];

  useEffect(() => {
    if (!defaultYearId) {
      return;
    }
    setDraftYearId((current) => current ?? defaultYearId);
    setAppliedYearId((current) => current ?? defaultYearId);
  }, [defaultYearId]);

  const items = data?.items ?? [];
  const pagination = data?.pagination;
  const totalPages = pagination?.totalPages ?? 0;

  function applySearch() {
    const next = searchInput.trim();
    if (
      next === appliedSearch &&
      draftYearId === appliedYearId &&
      draftClassId === appliedClassId &&
      draftSectionId === appliedSectionId
    ) {
      return;
    }
    setPage(1);
    setAppliedSearch(next);
    setAppliedYearId(draftYearId);
    setAppliedClassId(draftClassId);
    setAppliedSectionId(draftSectionId);
  }

  function onSort(column: WeeklySchedulesSortBy) {
    setPage(1);
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
      return;
    }
    setSortBy(column);
    setSortOrder("asc");
  }

  async function confirmDelete() {
    if (!pendingDelete) {
      return;
    }
    setDeleteError(null);
    try {
      await deleteSchedule(pendingDelete.id).unwrap();
      setPendingDelete(null);
    } catch (caught) {
      setDeleteError(
        getApiErrorMessage(caught, "Could not delete weekly schedule"),
      );
    }
  }

  const savedMessage = searchParams.get("saved") === "1";

  return (
    <>
      {savedMessage ? (
        <p
          className="mb-5 rounded-2xl border border-green-200 bg-green-50 px-5 py-4 text-sm text-green-800"
          role="status"
        >
          Weekly schedule saved successfully.
        </p>
      ) : null}

      {deleteError ? (
        <p
          className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700"
          role="alert"
        >
          {deleteError}
        </p>
      ) : null}

      <div className="mb-5 flex flex-wrap items-center gap-2">
        <TableSearchBar
          label="Search weekly schedule"
          placeholder="Search class or section"
          value={searchInput}
          onChange={setSearchInput}
          onSearch={applySearch}
          compact
        >
          <YearFilterSelect
            years={years}
            value={draftYearId}
            onChange={(yearId) => {
              setDraftYearId(yearId);
              setDraftClassId(0);
              setDraftSectionId(0);
            }}
          />
          <FilterSelect
            label="Filter by class"
            value={draftClassId}
            options={[
              { value: 0, label: "All classes" },
              ...classes.map((itemClass) => ({
                value: itemClass.id,
                label: itemClass.className,
              })),
            ]}
            onChange={(classId) => {
              setDraftClassId(classId);
              setDraftSectionId(0);
            }}
          />
          <FilterSelect
            label="Filter by section"
            value={draftSectionId}
            disabled={!classSelected}
            options={
              !classSelected
                ? [{ value: 0, label: "All sections" }]
                : sectionsLoading
                  ? [{ value: 0, label: "Loading sections…" }]
                  : [
                      { value: 0, label: "All sections" },
                      ...sections.map((section) => ({
                        value: section.id,
                        label: section.sectionTitle,
                      })),
                    ]
            }
            onChange={setDraftSectionId}
          />
        </TableSearchBar>
        <Link
          href="/schedule/add"
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
                  label="ID"
                  column="id"
                  sortBy={sortBy}
                  sortOrder={sortOrder}
                  onSort={onSort}
                />
                <SortHeader
                  label="Class / Section"
                  column="class"
                  sortBy={sortBy}
                  sortOrder={sortOrder}
                  onSort={onSort}
                />
                <SortHeader
                  label="Person"
                  column="person"
                  sortBy={sortBy}
                  sortOrder={sortOrder}
                  onSort={onSort}
                />
                <SortHeader
                  label="Year"
                  column="year"
                  sortBy={sortBy}
                  sortOrder={sortOrder}
                  onSort={onSort}
                />
                <SortHeader
                  label="Date"
                  column="date"
                  sortBy={sortBy}
                  sortOrder={sortOrder}
                  onSort={onSort}
                />
                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-muted">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading || !appliedYearId ? (
                <TableLoadingRow colSpan={6} label="Loading weekly schedules" />
              ) : error ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-10 text-center text-sm text-red-600"
                    role="alert"
                  >
                    {getApiErrorMessage(error, "Could not load weekly schedules")}
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-10 text-center text-sm text-muted"
                  >
                    No weekly schedules found. Click Add to create one.
                  </td>
                </tr>
              ) : (
                items.map((item) => {
                  const viewHref = `/schedule/view?yearId=${item.yearId}&classId=${item.classId}&sectionId=${item.sectionId}`;
                  const editHref = `/schedule/add?yearId=${item.yearId}&classId=${item.classId}&sectionId=${item.sectionId}`;
                  const classSection = `${item.className} / ${item.sectionTitle}`;

                  return (
                    <tr
                      key={item.id}
                      className={`border-b border-stone-100 last:border-b-0 odd:bg-white even:bg-primary-soft/50 ${isFetching ? "opacity-70" : ""}`}
                    >
                      <td className="whitespace-nowrap px-5 py-4 font-semibold text-foreground">
                        {item.id}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 font-medium text-foreground">
                        {classSection}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-foreground">
                        {item.createdByName ?? "Administrator"}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-foreground">
                        {item.yearTitle}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-foreground">
                        {formatDateTime(item.createdAt)}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4">
                        <div className="flex items-center gap-1">
                          <Link
                            href={viewHref}
                            className="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl border border-border bg-white text-foreground transition-colors hover:bg-primary-soft hover:text-primary"
                            aria-label={`View schedule for ${classSection}`}
                            title="View"
                          >
                            <Eye aria-hidden className="h-4 w-4" />
                          </Link>
                          <Link
                            href={editHref}
                            className="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl border border-border bg-white text-foreground transition-colors hover:bg-primary-soft hover:text-primary"
                            aria-label={`Edit schedule for ${classSection}`}
                            title="Edit"
                          >
                            <Pencil aria-hidden className="h-4 w-4" />
                          </Link>
                          <button
                            type="button"
                            className="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl border border-red-200 bg-red-50 text-red-600 transition-colors hover:bg-red-100"
                            aria-label={`Delete schedule for ${classSection}`}
                            title="Delete"
                            onClick={() => {
                              setDeleteError(null);
                              setPendingDelete({
                                id: item.id,
                                label: classSection,
                              });
                            }}
                          >
                            <Trash2 aria-hidden className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {pagination && totalPages > 0 ? (
          <div className="flex items-center justify-between gap-3 border-t border-stone-100 px-5 py-4">
            <p className="text-sm text-muted">
              Page {pagination.page} of {totalPages} · {pagination.total} schedules
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
          title="Delete weekly schedule"
          description={`Delete schedule for ${pendingDelete.label}? This cannot be undone.`}
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
