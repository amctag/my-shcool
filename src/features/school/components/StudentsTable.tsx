"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Eye, Pencil, Plus, Trash2 } from "lucide-react";
import { ConfirmDeleteDialog } from "@/components/dashboard/ConfirmDeleteDialog";
import { TableLoadingRow } from "@/components/dashboard/TableLoading";
import { TableSearchBar } from "@/components/dashboard/TableSearchBar";
import { NameWithInitials } from "@/components/dashboard/NameWithInitials";
import { getApiErrorMessage } from "@/lib/getApiErrorMessage";
import {
  useDeleteStudentMutation,
  useGetStudentsQuery,
} from "@/features/school/api/studentsApi";
import { selectAuthReady, selectAccessToken } from "@/features/auth/authSlice";
import { useAppSelector } from "@/store/hooks";
import type {
  DashboardChildrenQuery,
  StudentsSortBy,
  StudentsSortOrder,
} from "@/features/school/types";

function buildStudentsQuery(
  page: number,
  limit: number,
  appliedSearch: string,
  sortBy: StudentsSortBy,
  sortOrder: StudentsSortOrder,
): DashboardChildrenQuery {
  const query: DashboardChildrenQuery = { page, limit, sortBy, sortOrder };

  if (appliedSearch) {
    query.search = appliedSearch;
  }

  return query;
}

function studentName(firstName?: string, lastName?: string, fullName?: string): string {
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

function SortHeader({
  label,
  column,
  sortBy,
  sortOrder,
  onSort,
}: {
  label: string;
  column: StudentsSortBy;
  sortBy: StudentsSortBy;
  sortOrder: StudentsSortOrder;
  onSort: (column: StudentsSortBy) => void;
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

export function StudentsTable() {
  const ready = useAppSelector(selectAuthReady);
  const accessToken = useAppSelector(selectAccessToken);
  const [searchInput, setSearchInput] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<StudentsSortBy>("id");
  const [sortOrder, setSortOrder] = useState<StudentsSortOrder>("asc");
  const limit = 10;
  const [deleteStudent, deleteState] = useDeleteStudentMutation();
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<{
    id: number;
    name: string;
  } | null>(null);
  const canFetch = ready && Boolean(accessToken);
  const query = buildStudentsQuery(
    page,
    limit,
    appliedSearch,
    sortBy,
    sortOrder,
  );

  const { data, error, isLoading, isFetching } = useGetStudentsQuery(query, {
    skip: !canFetch,
  });

  function applySearch() {
    const next = searchInput.trim();
    if (next === appliedSearch) {
      return;
    }
    setPage(1);
    setAppliedSearch(next);
  }

  function onSort(column: StudentsSortBy) {
    setPage(1);
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
      return;
    }

    setSortBy(column);
    setSortOrder("asc");
  }

  const students = data?.items ?? [];
  const pagination = data?.pagination;
  const totalPages = pagination?.totalPages ?? 0;

  function askDeleteStudent(student: {
    id: number;
    firstName?: string;
    lastName?: string;
    fullName: string;
  }) {
    setDeleteError(null);
    setPendingDelete({
      id: student.id,
      name: studentName(student.firstName, student.lastName, student.fullName),
    });
  }

  async function confirmDeleteStudent() {
    if (!pendingDelete) {
      return;
    }

    setDeleteError(null);
    try {
      await deleteStudent(pendingDelete.id).unwrap();
      setPendingDelete(null);
    } catch (caught) {
      setDeleteError(getApiErrorMessage(caught, "Could not delete student"));
    }
  }

  return (
    <>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <TableSearchBar
          label="Search students"
          placeholder="Search by name or id"
          value={searchInput}
          onChange={setSearchInput}
          onSearch={applySearch}
        />
        <Link
          href="/students/add"
          className="inline-flex h-11 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-on-primary transition-colors duration-200 hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
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
                  label="Name"
                  column="name"
                  sortBy={sortBy}
                  sortOrder={sortOrder}
                  onSort={onSort}
                />
                <SortHeader
                  label="Parent"
                  column="parent"
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
                  label="Class"
                  column="class"
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
                <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-muted">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <TableLoadingRow colSpan={8} label="Loading students" />
              ) : error ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-5 py-10 text-center text-sm text-red-600"
                    role="alert"
                  >
                    {getApiErrorMessage(error, "Could not load students")}
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-5 py-10 text-center text-sm text-muted"
                  >
                    No students match this search.
                  </td>
                </tr>
              ) : (
                students.map((student) => (
                  <tr
                    key={student.id}
                    className={`border-b border-stone-100 last:border-b-0 ${
                      isFetching ? "opacity-70" : ""
                    }`}
                  >
                    <td className="whitespace-nowrap px-5 py-4 font-semibold text-foreground">
                      {student.id}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 font-semibold text-foreground">
                      <NameWithInitials
                        firstName={student.firstName}
                        lastName={student.lastName}
                        name={studentName(
                          student.firstName,
                          student.lastName,
                          student.fullName,
                        )}
                      />
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-foreground">
                      {student.parentName ?? "—"}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 tabular-nums text-foreground">
                      {student.phoneNumber ?? "—"}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-foreground">
                      {student.className ?? "—"}
                    </td>
                    <td className="px-5 py-4 text-foreground">
                      {student.address ?? "—"}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-foreground">
                      {formatBirthday(student.birthday)}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/students/${student.id}`}
                          aria-label="View"
                          title="View"
                          className="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl border border-border bg-white text-foreground transition-colors duration-200 hover:bg-primary-soft hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                        >
                          <Eye aria-hidden className="h-4 w-4" />
                        </Link>
                        <Link
                          href={`/students/${student.id}/edit`}
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
                          onClick={() => askDeleteStudent(student)}
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
              students
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
          onConfirm={() => void confirmDeleteStudent()}
        />
      ) : null}
    </>
  );
}
