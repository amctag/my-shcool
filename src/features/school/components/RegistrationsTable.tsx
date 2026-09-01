"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Plus,
  Trash2,
} from "lucide-react";
import { FilterSelect } from "@/components/dashboard/FilterSelect";
import { TableLoadingRow } from "@/components/dashboard/TableLoading";
import { TableSearchBar } from "@/components/dashboard/TableSearchBar";
import { YearFilterSelect } from "@/components/dashboard/YearFilterSelect";
import { getApiErrorMessage } from "@/lib/getApiErrorMessage";
import { useGetClassesQuery } from "@/features/school/api/classesApi";
import {
  useDeleteRegistrationMutation,
  useGetRegistrationsQuery,
} from "@/features/school/api/registrationsApi";
import { useSchoolYearFilter } from "@/features/school/useSchoolYearFilter";
import { selectAuthReady, selectAccessToken } from "@/features/auth/authSlice";
import { useAppSelector } from "@/store/hooks";
import type {
  DashboardRegistrationsQuery,
  RegistrationsSortBy,
  RegistrationsSortOrder,
} from "@/features/school/types";

const PAGE_SIZE = 10;

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
}

function buildQuery(
  page: number,
  appliedSearch: string,
  appliedYearId: number | null,
  appliedClassId: number,
  sortBy: RegistrationsSortBy,
  sortOrder: RegistrationsSortOrder,
): DashboardRegistrationsQuery {
  const query: DashboardRegistrationsQuery = {
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
  column: RegistrationsSortBy;
  sortBy: RegistrationsSortBy;
  sortOrder: RegistrationsSortOrder;
  onSort: (column: RegistrationsSortBy) => void;
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

export function RegistrationsTable() {
  const ready = useAppSelector(selectAuthReady);
  const accessToken = useAppSelector(selectAccessToken);
  const canFetch = ready && Boolean(accessToken);
  const { years, yearId: defaultYearId } = useSchoolYearFilter(canFetch);

  const [searchInput, setSearchInput] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [draftClassId, setDraftClassId] = useState(0);
  const [appliedClassId, setAppliedClassId] = useState(0);
  const [draftYearId, setDraftYearId] = useState<number | null>(null);
  const [appliedYearId, setAppliedYearId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<RegistrationsSortBy>("id");
  const [sortOrder, setSortOrder] = useState<RegistrationsSortOrder>("desc");
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const { data: classesData } = useGetClassesQuery(
    { page: 1, limit: 100, sortOrder: "asc" },
    { skip: !canFetch },
  );
  const classes = classesData?.items ?? [];

  const resolvedYearId = appliedYearId ?? defaultYearId;

  const { data, error, isLoading, isFetching } = useGetRegistrationsQuery(
    buildQuery(
      page,
      appliedSearch,
      resolvedYearId,
      appliedClassId,
      sortBy,
      sortOrder,
    ),
    { skip: !canFetch || !resolvedYearId },
  );

  const [deleteRegistration] = useDeleteRegistrationMutation();

  const items = data?.items ?? [];
  const totalPages = data?.pagination.totalPages ?? 0;

  function handleSort(column: RegistrationsSortBy) {
    setPage(1);
    if (sortBy === column) {
      setSortOrder((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }
    setSortBy(column);
    setSortOrder("asc");
  }

  async function handleDelete(id: number, studentName: string) {
    if (
      !window.confirm(`Remove registration for ${studentName}?`)
    ) {
      return;
    }
    setDeleteError(null);
    try {
      await deleteRegistration(id).unwrap();
    } catch (caught) {
      setDeleteError(
        getApiErrorMessage(caught, "Could not delete registration"),
      );
    }
  }

  function applySearch() {
    const next = searchInput.trim();
    const nextYearId = draftYearId ?? defaultYearId;
    if (
      next === appliedSearch &&
      nextYearId === appliedYearId &&
      draftClassId === appliedClassId
    ) {
      return;
    }
    setPage(1);
    setAppliedSearch(next);
    setAppliedYearId(nextYearId);
    setAppliedClassId(draftClassId);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <TableSearchBar
          label="Search registrations"
          placeholder="Search student"
          value={searchInput}
          onChange={setSearchInput}
          onSearch={applySearch}
          compact
        >
          <YearFilterSelect
            years={years}
            value={draftYearId ?? defaultYearId}
            onChange={setDraftYearId}
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
            onChange={setDraftClassId}
          />
        </TableSearchBar>
        <Link
          href="/registrations/add"
          className="inline-flex h-11 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-on-primary hover:bg-primary-hover"
        >
          <Plus aria-hidden className="h-4 w-4" />
          Add
        </Link>
      </div>

      {deleteError ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {deleteError}
        </p>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-stone-100 bg-stone-50/80">
              <tr>
                <SortHeader
                  label="ID"
                  column="id"
                  sortBy={sortBy}
                  sortOrder={sortOrder}
                  onSort={handleSort}
                />
                <SortHeader
                  label="Student"
                  column="student"
                  sortBy={sortBy}
                  sortOrder={sortOrder}
                  onSort={handleSort}
                />
                <SortHeader
                  label="Class"
                  column="class"
                  sortBy={sortBy}
                  sortOrder={sortOrder}
                  onSort={handleSort}
                />
                <SortHeader
                  label="Section"
                  column="section"
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
                <SortHeader
                  label="Date"
                  column="date"
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
                <TableLoadingRow colSpan={7} label="Loading registrations" />
              ) : error ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-10 text-center text-sm text-red-600"
                    role="alert"
                  >
                    {getApiErrorMessage(error, "Could not load registrations")}
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-10 text-center text-sm text-muted"
                  >
                    No registrations found. Click Add to create one.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr
                    key={item.id}
                    className={`border-b border-stone-100 last:border-b-0 odd:bg-white even:bg-primary-soft/50 ${isFetching ? "opacity-70" : ""}`}
                  >
                    <td className="whitespace-nowrap px-5 py-4 font-semibold text-foreground">
                      {item.id}
                    </td>
                    <td className="px-5 py-4 font-medium text-foreground">
                      {item.studentName}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-foreground">
                      {item.className}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-foreground">
                      {item.sectionTitle}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-foreground">
                      {item.yearTitle}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-foreground">
                      {formatDate(item.createdAt)}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4">
                      <button
                        type="button"
                        onClick={() =>
                          void handleDelete(item.id, item.studentName)
                        }
                        className="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl border border-border bg-white text-red-600 transition-colors hover:bg-red-50"
                        aria-label={`Delete registration for ${item.studentName}`}
                        title="Delete"
                      >
                        <Trash2 aria-hidden className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 ? (
          <div className="flex items-center justify-between border-t border-stone-100 px-5 py-4">
            <p className="text-sm text-muted">
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-border disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Previous page"
              >
                <ChevronLeft aria-hidden className="h-4 w-4" />
              </button>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() =>
                  setPage((current) => Math.min(totalPages, current + 1))
                }
                className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-border disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Next page"
              >
                <ChevronRight aria-hidden className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
