"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Eye,
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
import {
  useDeleteDashboardExamScheduleMutation,
  useGetDashboardExamSchedulesQuery,
} from "@/features/school/api/examSchedulesApi";
import { useSchoolYearFilter } from "@/features/school/useSchoolYearFilter";
import { selectAuthReady, selectAccessToken } from "@/features/auth/authSlice";
import { useAppSelector } from "@/store/hooks";
import type {
  DashboardExamSchedulesQuery,
  ExamSchedulesSortBy,
  ExamSchedulesSortOrder,
} from "@/features/school/types";

const PAGE_SIZE = 10;

function formatExamDate(value: string | null): string {
  if (!value) {
    return "—";
  }
  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(`${value}T00:00:00`));
}

function buildQuery(
  page: number,
  appliedSearch: string,
  appliedYearId: number | null,
  appliedClassId: number,
  sortBy: ExamSchedulesSortBy,
  sortOrder: ExamSchedulesSortOrder,
): DashboardExamSchedulesQuery {
  const query: DashboardExamSchedulesQuery = {
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
  column: ExamSchedulesSortBy;
  sortBy: ExamSchedulesSortBy;
  sortOrder: ExamSchedulesSortOrder;
  onSort: (column: ExamSchedulesSortBy) => void;
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

export function ExamSchedulesTable() {
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
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<ExamSchedulesSortBy>("id");
  const [sortOrder, setSortOrder] = useState<ExamSchedulesSortOrder>("asc");
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<{
    id: number;
    label: string;
  } | null>(null);
  const { years, yearId: defaultYearId } = useSchoolYearFilter(canFetch);

  useEffect(() => {
    if (!defaultYearId) {
      return;
    }
    setDraftYearId((current) => current ?? defaultYearId);
    setAppliedYearId((current) => current ?? defaultYearId);
  }, [defaultYearId]);

  const savedMessage = searchParams.get("saved") === "1";
  const savedMessageText = savedMessage
    ? "Exam saved successfully. Use Add schedule in the list to set the timetable."
    : null;

  const query = buildQuery(
    page,
    appliedSearch,
    appliedYearId,
    appliedClassId,
    sortBy,
    sortOrder,
  );

  const { data, error, isLoading, isFetching } =
    useGetDashboardExamSchedulesQuery(query, {
      skip: !canFetch || !appliedYearId,
    });

  const { data: classesData } = useGetClassesQuery(
    { page: 1, limit: 100, sortOrder: "asc" },
    { skip: !canFetch || !appliedYearId },
  );

  const [deleteExamSchedule, deleteState] =
    useDeleteDashboardExamScheduleMutation();

  const items = data?.items ?? [];
  const pagination = data?.pagination;
  const totalPages = pagination?.totalPages ?? 0;
  const classOptions = [
    { value: 0, label: "All classes" },
    ...(classesData?.items ?? []).map((item) => ({
      value: item.id,
      label: item.className,
    })),
  ];

  function applySearch() {
    const next = searchInput.trim();
    if (
      next === appliedSearch &&
      draftYearId === appliedYearId &&
      draftClassId === appliedClassId
    ) {
      return;
    }
    setPage(1);
    setAppliedSearch(next);
    setAppliedYearId(draftYearId);
    setAppliedClassId(draftClassId);
  }

  function onSort(column: ExamSchedulesSortBy) {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
    setPage(1);
  }

  async function confirmDelete() {
    if (!pendingDelete) {
      return;
    }
    try {
      await deleteExamSchedule(pendingDelete.id).unwrap();
      setPendingDelete(null);
      setDeleteError(null);
    } catch (err) {
      setDeleteError(
        getApiErrorMessage(err, "Could not delete exam schedule"),
      );
    }
  }

  return (
    <>
      {savedMessageText ? (
        <p
          className="mb-5 rounded-2xl border border-green-200 bg-green-50 px-5 py-4 text-sm text-green-800"
          role="status"
        >
          {savedMessageText}
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

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <TableSearchBar
          label="Search exam schedules"
          placeholder="Search title or class"
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
            }}
          />
          <FilterSelect
            label="Filter by class"
            value={draftClassId}
            options={classOptions}
            onChange={setDraftClassId}
          />
        </TableSearchBar>
        <Link
          href="/exams/add"
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
                  label="Title"
                  column="title"
                  sortBy={sortBy}
                  sortOrder={sortOrder}
                  onSort={onSort}
                />
                <SortHeader
                  label="Class"
                  column="class"
                  sortBy={sortBy}
                  sortOrder={sortOrder}
                  onSort={onSort}
                />
                <SortHeader
                  label="Grade type"
                  column="gradeType"
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
                <TableLoadingRow colSpan={7} label="Loading exam schedules" />
              ) : error ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-10 text-center text-sm text-red-600"
                    role="alert"
                  >
                    {getApiErrorMessage(error, "Could not load exam schedules")}
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-10 text-center text-sm text-muted"
                  >
                    No exam schedules found. Click Add to create one.
                  </td>
                </tr>
              ) : (
                items.map((item) => {
                  const hasSchedule = Boolean(item.examDate);
                  const viewHref = `/exams/view?scheduleId=${item.id}`;
                  const scheduleHref = `/exams/edit?scheduleId=${item.id}`;

                  return (
                    <tr
                      key={item.id}
                      className={`border-b border-stone-100 last:border-b-0 odd:bg-white even:bg-primary-soft/50 ${isFetching ? "opacity-70" : ""}`}
                    >
                      <td className="whitespace-nowrap px-5 py-4 font-semibold text-foreground">
                        {item.id}
                      </td>
                      <td className="px-5 py-4 font-medium text-foreground">
                        {item.title}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-foreground">
                        {item.className}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-foreground">
                        {item.gradeTypeTitle}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-foreground">
                        {item.yearTitle}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-foreground">
                        {formatExamDate(item.examDate)}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4">
                        <div className="flex items-center gap-1">
                          {hasSchedule ? (
                            <Link
                              href={viewHref}
                              className="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl border border-border bg-white text-foreground transition-colors hover:bg-primary-soft hover:text-primary"
                              aria-label={`View ${item.title}`}
                              title="View schedule"
                            >
                              <Eye aria-hidden className="h-4 w-4" />
                            </Link>
                          ) : (
                            <Link
                              href={scheduleHref}
                              className="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl border border-border bg-white text-foreground transition-colors hover:bg-primary-soft hover:text-primary"
                              aria-label={`Add schedule for ${item.title}`}
                              title="Add schedule"
                            >
                              <CalendarDays aria-hidden className="h-4 w-4" />
                            </Link>
                          )}
                          <button
                            type="button"
                            className="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl border border-red-200 bg-red-50 text-red-600 transition-colors hover:bg-red-100"
                            aria-label={`Delete ${item.title}`}
                            title="Delete"
                            onClick={() => {
                              setDeleteError(null);
                              setPendingDelete({
                                id: item.id,
                                label: item.title,
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
              Page {pagination.page} of {totalPages} · {pagination.total}{" "}
              schedules
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
          title="Delete exam schedule?"
          description={`This will permanently delete "${pendingDelete.label}".`}
          busy={deleteState.isLoading}
          error={deleteError}
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
