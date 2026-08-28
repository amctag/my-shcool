"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Eye,
  Pause,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { ConfirmDeleteDialog } from "@/components/dashboard/ConfirmDeleteDialog";
import { StatusFilterSelect } from "@/components/dashboard/StatusFilterSelect";
import { TableLoadingRow } from "@/components/dashboard/TableLoading";
import { TableSearchBar } from "@/components/dashboard/TableSearchBar";
import { NameWithInitials } from "@/components/dashboard/NameWithInitials";
import { getApiErrorMessage } from "@/lib/getApiErrorMessage";
import {
  teachersApi,
  useDeleteTeacherMutation,
  useGetTeachersQuery,
  useUpdateTeacherStatusMutation,
} from "@/features/school/api/teachersApi";
import { selectAuthReady, selectAccessToken } from "@/features/auth/authSlice";
import { useAppSelector } from "@/store/hooks";
import type {
  DashboardTeachersQuery,
  PersonStatusFilter,
  TeachersSortBy,
  TeachersSortOrder,
} from "@/features/school/types";

function buildTeachersQuery(
  page: number,
  limit: number,
  appliedSearch: string,
  sortBy: TeachersSortBy,
  sortOrder: TeachersSortOrder,
  statusFilter: PersonStatusFilter,
): DashboardTeachersQuery {
  const query: DashboardTeachersQuery = { page, limit, sortBy, sortOrder };

  if (appliedSearch) {
    query.search = appliedSearch;
  }
  if (statusFilter !== "all") {
    query.status = statusFilter;
  }

  return query;
}

function teacherName(
  firstName?: string,
  lastName?: string,
  fullName?: string,
): string {
  const combined = `${firstName?.trim() ?? ""} ${lastName?.trim() ?? ""}`.trim();
  return combined || fullName?.trim() || "—";
}

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

function formatBirthday(value?: string | null): string {
  if (!value) {
    return "—";
  }

  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) {
    return value;
  }

  const month = MONTHS[Number(match[2]) - 1];
  if (!month) {
    return value;
  }

  return `${month} ${Number(match[3])}, ${match[1]}`;
}

function isTeacherActive(status?: boolean) {
  return status !== false;
}

function IconColumnHeader({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <th className="w-14 px-2 py-3.5 text-center">
      <span
        className="inline-flex min-h-11 min-w-11 items-center justify-center text-muted"
        title={label}
        aria-label={label}
      >
        {children}
      </span>
    </th>
  );
}

function SortHeader({
  label,
  column,
  sortBy,
  sortOrder,
  onSort,
}: {
  label: string;
  column: TeachersSortBy;
  sortBy: TeachersSortBy;
  sortOrder: TeachersSortOrder;
  onSort: (column: TeachersSortBy) => void;
}) {
  const active = sortBy === column;
  const nextOrder = active && sortOrder === "asc" ? "descending" : "ascending";

  return (
    <th className="px-5 py-3.5">
      <button
        type="button"
        onClick={() => onSort(column)}
        aria-sort={
          active ? (sortOrder === "asc" ? "ascending" : "descending") : "none"
        }
        className="inline-flex min-h-11 cursor-pointer items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        aria-label={`Sort by ${label} ${nextOrder}`}
      >
        {label}
        <span className="inline-flex flex-col -space-y-1" aria-hidden>
          <ChevronUp
            className={`h-3 w-3 ${
              active && sortOrder === "asc" ? "text-primary" : "text-muted/40"
            }`}
          />
          <ChevronDown
            className={`h-3 w-3 ${
              active && sortOrder === "desc" ? "text-primary" : "text-muted/40"
            }`}
          />
        </span>
      </button>
    </th>
  );
}

export function TeachersTable() {
  const ready = useAppSelector(selectAuthReady);
  const accessToken = useAppSelector(selectAccessToken);
  const [searchInput, setSearchInput] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<TeachersSortBy>("id");
  const [sortOrder, setSortOrder] = useState<TeachersSortOrder>("asc");
  const [statusFilterInput, setStatusFilterInput] =
    useState<PersonStatusFilter>("all");
  const [statusFilter, setStatusFilter] = useState<PersonStatusFilter>("all");
  const limit = 10;
  const prefetchTeachers = teachersApi.usePrefetch("getTeachers");
  const [deleteTeacher, deleteState] = useDeleteTeacherMutation();
  const [updateTeacherStatus, statusState] = useUpdateTeacherStatusMutation();
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<{
    id: number;
    name: string;
  } | null>(null);
  const canFetch = ready && Boolean(accessToken);
  const query = buildTeachersQuery(
    page,
    limit,
    appliedSearch,
    sortBy,
    sortOrder,
    statusFilter,
  );

  const { data, error, isLoading, isFetching } = useGetTeachersQuery(query, {
    skip: !canFetch,
  });

  function applySearch() {
    const next = searchInput.trim();
    if (next === appliedSearch && statusFilterInput === statusFilter) {
      return;
    }
    setPage(1);
    setAppliedSearch(next);
    setStatusFilter(statusFilterInput);
  }

  useEffect(() => {
    const totalPages = data?.pagination.totalPages ?? 0;
    if (!canFetch || totalPages < page + 1) {
      return;
    }

    prefetchTeachers(
      buildTeachersQuery(page + 1, limit, appliedSearch, sortBy, sortOrder, statusFilter),
    );
  }, [
    appliedSearch,
    canFetch,
    data?.pagination.totalPages,
    limit,
    page,
    prefetchTeachers,
    sortBy,
    sortOrder,
    statusFilter,
  ]);

  function onSort(column: TeachersSortBy) {
    setPage(1);
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
      return;
    }

    setSortBy(column);
    setSortOrder("asc");
  }

  const teachers = data?.items ?? [];
  const pagination = data?.pagination;
  const totalPages = pagination?.totalPages ?? 0;

  function askDeleteTeacher(teacher: {
    id: number;
    firstName?: string;
    lastName?: string;
    fullName: string;
  }) {
    setDeleteError(null);
    setPendingDelete({
      id: teacher.id,
      name: teacherName(teacher.firstName, teacher.lastName, teacher.fullName),
    });
  }

  async function confirmDeleteTeacher() {
    if (!pendingDelete) {
      return;
    }

    setDeleteError(null);
    try {
      await deleteTeacher(pendingDelete.id).unwrap();
      setPendingDelete(null);
    } catch (caught) {
      setDeleteError(getApiErrorMessage(caught, "Could not delete teacher"));
    }
  }

  async function toggleTeacherStatus(teacher: { id: number; status?: boolean }) {
    setStatusError(null);
    try {
      await updateTeacherStatus({
        id: teacher.id,
        status: !isTeacherActive(teacher.status),
      }).unwrap();
    } catch (caught) {
      setStatusError(getApiErrorMessage(caught, "Could not update teacher status"));
    }
  }

  return (
    <>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex w-full min-w-0 flex-col gap-3 sm:flex-row sm:items-center">
          <TableSearchBar
            label="Search teachers"
            placeholder="Search by name, id, or phone"
            value={searchInput}
            onChange={setSearchInput}
            onSearch={applySearch}
          >
            <StatusFilterSelect
              value={statusFilterInput}
              onChange={setStatusFilterInput}
            />
          </TableSearchBar>
        </div>
        <Link
          href="/teachers/add"
          className="inline-flex h-11 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-on-primary transition-colors duration-200 hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <Plus aria-hidden className="h-4 w-4" />
          Add
        </Link>
      </div>
      {statusError ? (
        <p className="mb-4 text-sm text-red-600" role="alert">
          {statusError}
        </p>
      ) : null}
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
                  label="Name"
                  column="name"
                  sortBy={sortBy}
                  sortOrder={sortOrder}
                  onSort={onSort}
                />
                <SortHeader
                  label="Phone"
                  column="phone"
                  sortBy={sortBy}
                  sortOrder={sortOrder}
                  onSort={onSort}
                />
                <SortHeader
                  label="Address"
                  column="address"
                  sortBy={sortBy}
                  sortOrder={sortOrder}
                  onSort={onSort}
                />
                <SortHeader
                  label="Birthday"
                  column="birthday"
                  sortBy={sortBy}
                  sortOrder={sortOrder}
                  onSort={onSort}
                />
                <IconColumnHeader label="Status">
                  <Pause aria-hidden className="h-4 w-4" />
                </IconColumnHeader>
                <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-muted">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <TableLoadingRow colSpan={7} label="Loading teachers" />
              ) : error ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-10 text-center text-sm text-red-600"
                    role="alert"
                  >
                    {getApiErrorMessage(error, "Could not load teachers")}
                  </td>
                </tr>
              ) : teachers.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-10 text-center text-sm text-muted"
                  >
                    No teachers match this search.
                  </td>
                </tr>
              ) : (
                teachers.map((teacher) => (
                  <tr
                    key={teacher.id}
                    className={`border-b border-stone-100 last:border-b-0 ${
                      isFetching ? "opacity-70" : ""
                    }`}
                  >
                    <td className="whitespace-nowrap px-5 py-4 font-semibold text-foreground">
                      {teacher.id}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 font-semibold text-foreground">
                      <NameWithInitials
                        firstName={teacher.firstName}
                        lastName={teacher.lastName}
                        name={teacherName(
                          teacher.firstName,
                          teacher.lastName,
                          teacher.fullName,
                        )}
                      />
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 tabular-nums text-foreground">
                      {teacher.phoneNumber ?? "—"}
                    </td>
                    <td className="px-5 py-4 text-foreground">
                      {teacher.address ?? "—"}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-foreground">
                      {formatBirthday(teacher.birthday)}
                    </td>
                    <td className="px-2 py-4 text-center">
                      <button
                        type="button"
                        aria-pressed={isTeacherActive(teacher.status)}
                        aria-label={
                          isTeacherActive(teacher.status)
                            ? "Active — click to close"
                            : "Closed — click to activate"
                        }
                        title={
                          isTeacherActive(teacher.status)
                            ? "Active — click to close"
                            : "Closed — click to activate"
                        }
                        disabled={statusState.isLoading}
                        onClick={() => void toggleTeacherStatus(teacher)}
                        className="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl hover:bg-primary-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isTeacherActive(teacher.status) ? (
                          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-white">
                            <Check aria-hidden className="h-4 w-4" strokeWidth={3} />
                          </span>
                        ) : (
                          <span className="relative inline-flex h-5 w-5 items-center justify-center">
                            <span className="h-5 w-5 rounded-full bg-primary" />
                            <span className="absolute h-2 w-2 rounded-full bg-white" />
                          </span>
                        )}
                      </button>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/teachers/${teacher.id}`}
                          aria-label="View"
                          title="View"
                          className="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl border border-border bg-white text-foreground transition-colors duration-200 hover:bg-primary-soft hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                        >
                          <Eye aria-hidden className="h-4 w-4" />
                        </Link>
                        <Link
                          href={`/teachers/${teacher.id}/edit`}
                          aria-label="Edit"
                          title="Edit"
                          className="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl border border-border bg-white text-foreground transition-colors duration-200 hover:bg-primary-soft hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                        >
                          <Pencil aria-hidden className="h-4 w-4" />
                        </Link>
                        <button
                          type="button"
                          aria-label="Delete"
                          title="Delete"
                          disabled={deleteState.isLoading}
                          onClick={() => askDeleteTeacher(teacher)}
                          className="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl border border-red-200 bg-white text-red-600 transition-colors duration-200 hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50"
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
              Page {pagination.page} of {totalPages} · {pagination.total}{" "}
              teachers
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={page <= 1 || isFetching}
                onClick={() => setPage(page - 1)}
                className="inline-flex h-11 cursor-pointer items-center gap-1 rounded-xl border border-border px-3 text-sm font-medium hover:bg-primary-soft disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ChevronLeft aria-hidden className="h-4 w-4" />
                Previous
              </button>
              <button
                type="button"
                disabled={page >= totalPages || isFetching}
                onMouseEnter={() => {
                  if (page < totalPages) {
                    prefetchTeachers(
                      buildTeachersQuery(
                        page + 1,
                        limit,
                        appliedSearch,
                        sortBy,
                        sortOrder,
                        statusFilter,
                      ),
                    );
                  }
                }}
                onClick={() => setPage(page + 1)}
                className="inline-flex h-11 cursor-pointer items-center gap-1 rounded-xl border border-border px-3 text-sm font-medium hover:bg-primary-soft disabled:cursor-not-allowed disabled:opacity-50"
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
          title="Are you sure?"
          description={`Delete ${pendingDelete.name}? This cannot be undone.`}
          error={deleteError}
          busy={deleteState.isLoading}
          onCancel={() => {
            if (!deleteState.isLoading) {
              setPendingDelete(null);
              setDeleteError(null);
            }
          }}
          onConfirm={() => void confirmDeleteTeacher()}
        />
      ) : null}
    </>
  );
}
