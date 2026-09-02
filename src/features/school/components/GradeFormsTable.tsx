"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { TableLoadingRow } from "@/components/dashboard/TableLoading";
import { TableSearchBar } from "@/components/dashboard/TableSearchBar";
import { YearFilterSelect } from "@/components/dashboard/YearFilterSelect";
import { ConfirmDeleteDialog } from "@/components/dashboard/ConfirmDeleteDialog";
import { getApiErrorMessage } from "@/lib/getApiErrorMessage";
import { GradeFormClassesDrawer } from "@/features/school/components/GradeFormClassesDrawer";
import {
  useDeleteGradeFormMutation,
  useGetGradeFormsQuery,
} from "@/features/school/api/gradeFormsApi";
import { useSchoolYearFilter } from "@/features/school/useSchoolYearFilter";
import { selectAuthReady, selectAccessToken } from "@/features/auth/authSlice";
import { useAppSelector } from "@/store/hooks";
import type {
  DashboardGradeForm,
  DashboardGradeFormsQuery,
  GradeFormsSortBy,
  GradeFormsSortOrder,
} from "@/features/school/types";

const PAGE_SIZE = 10;

function buildQuery(
  page: number,
  appliedSearch: string,
  appliedYearId: number | null,
  sortBy: GradeFormsSortBy,
  sortOrder: GradeFormsSortOrder,
): DashboardGradeFormsQuery {
  const query: DashboardGradeFormsQuery = {
    page,
    limit: PAGE_SIZE,
    sortBy,
    sortOrder,
  };
  if (appliedSearch) query.search = appliedSearch;
  if (appliedYearId) query.yearId = appliedYearId;
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
  column: GradeFormsSortBy;
  sortBy: GradeFormsSortBy;
  sortOrder: GradeFormsSortOrder;
  onSort: (column: GradeFormsSortBy) => void;
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

export function GradeFormsTable() {
  const ready = useAppSelector(selectAuthReady);
  const accessToken = useAppSelector(selectAccessToken);
  const canFetch = ready && Boolean(accessToken);
  const { years, yearId: defaultYearId } = useSchoolYearFilter(canFetch);

  const [searchInput, setSearchInput] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [draftYearId, setDraftYearId] = useState<number | null>(null);
  const [appliedYearId, setAppliedYearId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<GradeFormsSortBy>("id");
  const [sortOrder, setSortOrder] = useState<GradeFormsSortOrder>("desc");
  const [drawerForm, setDrawerForm] = useState<DashboardGradeForm | null>(null);
  const [pendingDelete, setPendingDelete] = useState<{
    id: number;
    title: string;
  } | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const resolvedYearId = appliedYearId ?? defaultYearId;

  const { data, error, isLoading, isFetching } = useGetGradeFormsQuery(
    buildQuery(page, appliedSearch, resolvedYearId, sortBy, sortOrder),
    { skip: !canFetch || !resolvedYearId },
  );
  const [deleteGradeForm, deleteState] = useDeleteGradeFormMutation();

  const items = data?.items ?? [];
  const pagination = data?.pagination;
  const totalPages = pagination?.totalPages ?? 0;

  function applySearch() {
    const next = searchInput.trim();
    const nextYearId = draftYearId ?? defaultYearId;
    if (next === appliedSearch && nextYearId === appliedYearId) {
      return;
    }
    setPage(1);
    setAppliedSearch(next);
    setAppliedYearId(nextYearId);
  }

  function handleSort(column: GradeFormsSortBy) {
    setPage(1);
    if (sortBy === column) {
      setSortOrder((current) => (current === "asc" ? "desc" : "asc"));
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
      await deleteGradeForm(pendingDelete.id).unwrap();
      setPendingDelete(null);
    } catch (caught) {
      setDeleteError(getApiErrorMessage(caught, "Could not delete grade form"));
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <TableSearchBar
          label="Search grade forms"
          placeholder="Search title or year"
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
        </TableSearchBar>
        <Link
          href="/grade-forms/add"
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
                  onSort={handleSort}
                />
                <SortHeader
                  label="Title"
                  column="title"
                  sortBy={sortBy}
                  sortOrder={sortOrder}
                  onSort={handleSort}
                />
                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-muted">
                  Classes
                </th>
                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-muted">
                  Details
                </th>
                <SortHeader
                  label="Year"
                  column="year"
                  sortBy={sortBy}
                  sortOrder={sortOrder}
                  onSort={handleSort}
                />
                <SortHeader
                  label="Status"
                  column="status"
                  sortBy={sortBy}
                  sortOrder={sortOrder}
                  onSort={handleSort}
                />
                <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-muted">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading || !resolvedYearId ? (
                <TableLoadingRow colSpan={7} label="Loading grade forms" />
              ) : error ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-10 text-center text-sm text-red-600"
                    role="alert"
                  >
                    {getApiErrorMessage(error, "Could not load grade forms")}
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-10 text-center text-sm text-muted"
                  >
                    No grade forms found. Click Add to create one.
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
                      {item.title}
                    </td>
                    <td className="px-5 py-4">
                      <button
                        type="button"
                        onClick={() => setDrawerForm(item)}
                        className="max-w-[14rem] cursor-pointer truncate text-left text-sm font-medium text-primary hover:text-primary-hover hover:underline"
                        title={
                          item.classNames.length > 0
                            ? item.classNames.join(", ")
                            : "Assign classes"
                        }
                      >
                        {item.classNames.length > 0
                          ? item.classNames.join(", ")
                          : "Assign classes"}
                      </button>
                    </td>
                    <td className="px-5 py-4">
                      <Link
                        href={`/grade-forms/${item.id}/details`}
                        className="text-sm font-medium text-primary hover:text-primary-hover hover:underline"
                      >
                        {item.detailCount}{" "}
                        {item.detailCount === 1 ? "detail" : "details"}
                      </Link>
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-foreground">
                      {item.yearTitle}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-foreground">
                      {item.status ? "Active" : "Inactive"}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/grade-forms/${item.id}/edit`}
                          aria-label={`Edit ${item.title}`}
                          title="Edit"
                          className="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl border border-border bg-white hover:bg-primary-soft hover:text-primary"
                        >
                          <Pencil aria-hidden className="h-4 w-4" />
                        </Link>
                        <button
                          type="button"
                          aria-label={`Delete ${item.title}`}
                          title="Delete"
                          disabled={deleteState.isLoading}
                          onClick={() => {
                            setDeleteError(null);
                            setPendingDelete({ id: item.id, title: item.title });
                          }}
                          className="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl border border-border bg-white hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
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
              Page {pagination.page} of {totalPages} · {pagination.total} grade
              form{pagination.total === 1 ? "" : "s"}
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

      {drawerForm ? (
        <GradeFormClassesDrawer
          form={drawerForm}
          onClose={() => setDrawerForm(null)}
        />
      ) : null}

      {pendingDelete ? (
        <ConfirmDeleteDialog
          title="Delete grade form"
          description={`Delete ${pendingDelete.title}? This cannot be undone.`}
          error={deleteError}
          busy={deleteState.isLoading}
          onCancel={() => {
            setPendingDelete(null);
            setDeleteError(null);
          }}
          onConfirm={() => void confirmDelete()}
        />
      ) : null}
    </div>
  );
}
