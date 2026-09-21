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
  X,
} from "lucide-react";
import { ConfirmDeleteDialog } from "@/components/dashboard/ConfirmDeleteDialog";
import { FilterSelect } from "@/components/dashboard/FilterSelect";
import { TeacherFilterSearch } from "@/components/dashboard/TeacherFilterSearch";
import { TableLoadingRow } from "@/components/dashboard/TableLoading";
import { TablePagination } from "@/components/dashboard/TablePagination";
import { TableSearchBar } from "@/components/dashboard/TableSearchBar";
import { YearFilterSelect } from "@/components/dashboard/YearFilterSelect";
import { getApiErrorMessage } from "@/lib/getApiErrorMessage";
import { useGetClassesQuery } from "@/features/school/api/classesApi";
import {
  useDeleteTeacherSupervisorMutation,
  useGetTeacherSupervisorsQuery,
} from "@/features/school/api/teacherSupervisorsApi";
import { useSchoolYearFilter } from "@/features/school/useSchoolYearFilter";
import { selectAuthReady, selectAccessToken } from "@/features/auth/authSlice";
import { useAppSelector } from "@/store/hooks";
import type {
  DashboardTeacherSupervisorGroup,
  DashboardTeacherSupervisorsQuery,
  TeacherSupervisorsSortBy,
  TeacherSupervisorsSortOrder,
} from "@/features/school/types";

function SupervisorClassesDrawer({
  group,
  onClose,
}: {
  group: DashboardTeacherSupervisorGroup;
  onClose: () => void;
}) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  const total = group.classes.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <button
        type="button"
        aria-label="Close supervised classes"
        className="absolute inset-0 cursor-pointer bg-black/40"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="supervisor-classes-drawer-title"
        className="relative z-10 w-full max-h-[90dvh] max-w-lg overflow-y-auto rounded-3xl bg-surface p-6 shadow-xl sm:p-8"
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              Supervised classes
            </p>
            <h2
              id="supervisor-classes-drawer-title"
              className="mt-1 text-2xl font-semibold text-foreground"
            >
              {group.teacherName}
            </h2>
            <p className="mt-1 text-sm text-muted">
              {group.yearTitle} · {total}{" "}
              {total === 1 ? "class" : "classes"}
            </p>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="inline-flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full hover:bg-primary-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <X aria-hidden className="h-5 w-5" />
          </button>
        </div>
        <ul className="overflow-hidden rounded-2xl border border-border bg-white">
          {group.classes.map((cls, index) => (
            <li
              key={cls.id}
              className={`flex items-center justify-between gap-3 px-5 py-4 ${
                index < group.classes.length - 1 ? "border-b border-stone-100" : ""
              }`}
            >
              <span className="font-medium text-foreground">{cls.className}</span>
              <Link
                href={`/teacher-supervisors/${cls.id}`}
                className="text-sm font-medium text-primary hover:text-primary-hover hover:underline"
              >
                View
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

type SupervisorFilters = {
  classId: number;
  teacherId: number;
};

const emptyFilters: SupervisorFilters = {
  classId: 0,
  teacherId: 0,
};

function filtersEqual(left: SupervisorFilters, right: SupervisorFilters): boolean {
  return left.classId === right.classId && left.teacherId === right.teacherId;
}

function buildQuery(
  page: number,
  limit: number,
  appliedSearch: string,
  sortBy: TeacherSupervisorsSortBy,
  sortOrder: TeacherSupervisorsSortOrder,
  yearId: number | null | undefined,
  filters: SupervisorFilters = emptyFilters,
): DashboardTeacherSupervisorsQuery {
  const query: DashboardTeacherSupervisorsQuery = {
    page,
    limit,
    sortBy,
    sortOrder,
  };
  if (appliedSearch) {
    query.search = appliedSearch;
  }
  if (yearId) {
    query.yearId = yearId;
  }
  if (filters.classId) {
    query.classId = filters.classId;
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
  column: TeacherSupervisorsSortBy;
  sortBy: TeacherSupervisorsSortBy;
  sortOrder: TeacherSupervisorsSortOrder;
  onSort: (column: TeacherSupervisorsSortBy) => void;
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

export function TeacherSupervisorsTable() {
  const ready = useAppSelector(selectAuthReady);
  const accessToken = useAppSelector(selectAccessToken);
  const [searchInput, setSearchInput] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [draftFilters, setDraftFilters] = useState<SupervisorFilters>(emptyFilters);
  const [appliedFilters, setAppliedFilters] = useState<SupervisorFilters>(emptyFilters);
  const [draftYearId, setDraftYearId] = useState<number | null>(null);
  const [appliedYearId, setAppliedYearId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<TeacherSupervisorsSortBy>("teacher");
  const [sortOrder, setSortOrder] = useState<TeacherSupervisorsSortOrder>("asc");
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<DashboardTeacherSupervisorGroup | null>(
    null,
  );
  const [classesDrawer, setClassesDrawer] =
    useState<DashboardTeacherSupervisorGroup | null>(null);
  const limit = 10;
  const canFetch = ready && Boolean(accessToken);
  const { years, yearId: defaultYearId } = useSchoolYearFilter(canFetch);
  const query = buildQuery(
    page,
    limit,
    appliedSearch,
    sortBy,
    sortOrder,
    appliedYearId,
    appliedFilters,
  );
  const { data, error, isLoading, isFetching } = useGetTeacherSupervisorsQuery(
    query,
    { skip: !canFetch || !appliedYearId },
  );
  const { data: classesData } = useGetClassesQuery(
    { page: 1, limit: 100 },
    { skip: !canFetch },
  );
  const [deleteSupervisor, deleteState] = useDeleteTeacherSupervisorMutation();
  const classes = classesData?.items ?? [];

  useEffect(() => {
    if (!defaultYearId) {
      return;
    }
    setDraftYearId((current) => current ?? defaultYearId);
    setAppliedYearId((current) => current ?? defaultYearId);
  }, [defaultYearId]);

  function applySearch() {
    const next = searchInput.trim();
    if (
      next === appliedSearch &&
      draftYearId === appliedYearId &&
      filtersEqual(draftFilters, appliedFilters)
    ) {
      return;
    }
    setPage(1);
    setAppliedSearch(next);
    setAppliedYearId(draftYearId);
    setAppliedFilters(draftFilters);
  }

  function onSort(column: TeacherSupervisorsSortBy) {
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
      for (const cls of pendingDelete.classes) {
        await deleteSupervisor(cls.id).unwrap();
      }
      setPendingDelete(null);
    } catch (caught) {
      setDeleteError(getApiErrorMessage(caught, "Could not remove supervisor"));
    }
  }

  return (
    <>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <TableSearchBar
          label="Search supervisors"
          placeholder="Search"
          value={searchInput}
          onChange={setSearchInput}
          onSearch={applySearch}
          compact
        >
          <YearFilterSelect
            years={years}
            value={draftYearId}
            onChange={(nextYearId) => {
              setDraftYearId(nextYearId);
            }}
          />
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
              }))
            }
          />
          <TeacherFilterSearch
            value={draftFilters.teacherId}
            onChange={(teacherId) =>
              setDraftFilters((current) => ({ ...current, teacherId }))
            }
          />
        </TableSearchBar>
        <Link
          href="/teacher-supervisors/add"
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
                <SortHeader label="Teacher" column="teacher" sortBy={sortBy} sortOrder={sortOrder} onSort={onSort} />
                <SortHeader label="Classes" column="class" sortBy={sortBy} sortOrder={sortOrder} onSort={onSort} />
                <SortHeader label="Year" column="year" sortBy={sortBy} sortOrder={sortOrder} onSort={onSort} />
                <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-muted">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading || !appliedYearId ? (
                <TableLoadingRow colSpan={4} label="Loading supervisors" />
              ) : error ? (
                <tr>
                  <td colSpan={4} className="px-5 py-10 text-center text-sm text-red-600" role="alert">
                    {getApiErrorMessage(error, "Could not load supervisors")}
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-10 text-center text-sm text-muted">
                    No supervisor assignments for this year.
                  </td>
                </tr>
              ) : (
                items.map((item) => {
                  const primaryId = item.classes[0]?.id;
                  return (
                    <tr
                      key={`${item.teacherId}-${item.yearId}`}
                      className={`border-b border-stone-100 last:border-b-0 ${isFetching ? "opacity-70" : ""}`}
                    >
                      <td className="whitespace-nowrap px-5 py-4 font-semibold">
                        {item.teacherName}
                      </td>
                      <td className="px-5 py-4">
                        {item.classes.length > 0 ? (
                          <button
                            type="button"
                            onClick={() => setClassesDrawer(item)}
                            className="cursor-pointer text-left text-sm font-medium text-primary hover:text-primary-hover hover:underline"
                            title={item.classes.map((cls) => cls.className).join(", ")}
                          >
                            {item.classes.length}{" "}
                            {item.classes.length === 1 ? "class" : "classes"}
                          </button>
                        ) : (
                          <span className="text-muted">0 classes</span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4">{item.yearTitle}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-2">
                          {primaryId ? (
                            <>
                              <Link
                                href={`/teacher-supervisors/${primaryId}`}
                                aria-label="View"
                                className="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl border border-border bg-white hover:bg-primary-soft hover:text-primary"
                              >
                                <Eye aria-hidden className="h-4 w-4" />
                              </Link>
                              <Link
                                href={`/teacher-supervisors/${primaryId}/edit`}
                                aria-label="Edit"
                                className="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl border border-border bg-white hover:bg-primary-soft hover:text-primary"
                              >
                                <Pencil aria-hidden className="h-4 w-4" />
                              </Link>
                            </>
                          ) : null}
                          <button
                            type="button"
                            aria-label="Delete"
                            disabled={deleteState.isLoading}
                            onClick={() => {
                              setDeleteError(null);
                              setPendingDelete(item);
                            }}
                            className="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl border border-border bg-white text-red-600 hover:bg-red-50 disabled:opacity-40"
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
          <TablePagination
            page={page}
            totalPages={totalPages}
            total={pagination.total}
            label="supervisors"
            disabled={isFetching}
            onPageChange={(next) => setPage(next)}
          />
        ) : null}
      </article>
      {classesDrawer ? (
        <SupervisorClassesDrawer
          group={classesDrawer}
          onClose={() => setClassesDrawer(null)}
        />
      ) : null}
      {pendingDelete ? (
        <ConfirmDeleteDialog
          title="Remove supervisor"
          description={`Remove ${pendingDelete.teacherName} as supervisor of ${pendingDelete.classes.map((cls) => cls.className).join(", ")}?`}
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
