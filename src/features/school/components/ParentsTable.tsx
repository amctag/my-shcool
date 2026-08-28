"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  User,
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
  X,
} from "lucide-react";
import { ConfirmDeleteDialog } from "@/components/dashboard/ConfirmDeleteDialog";
import { StatusFilterSelect } from "@/components/dashboard/StatusFilterSelect";
import { TableSearchBar } from "@/components/dashboard/TableSearchBar";
import { NameWithInitials } from "@/components/dashboard/NameWithInitials";
import { getApiErrorMessage } from "@/lib/getApiErrorMessage";
import { useGetChildrenQuery } from "@/features/school/api/childrenApi";
import { parentsApi, useDeleteParentMutation, useGetParentsQuery, useUpdateParentStatusMutation } from "@/features/school/api/parentsApi";
import {
  applyParentsSearch,
  clearSelectedParent,
  selectParent,
  selectParentsAppliedSearch,
  selectParentsLimit,
  selectParentsPage,
  selectParentsSearchInput,
  selectParentsSortBy,
  selectParentsSortOrder,
  selectParentsStatusFilter,
  selectSelectedParentId,
  setParentsPage,
  setParentsSearchInput,
  setParentsSort,
  setParentsStatusFilter,
} from "@/features/school/parentsSlice";
import { selectAuthReady, selectAccessToken } from "@/features/auth/authSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import type {
  DashboardParentsQuery,
  ParentsSortBy,
  ParentsSortOrder,
  PersonStatusFilter,
} from "@/features/school/types";

function buildParentsQuery(
  page: number,
  limit: number,
  appliedSearch: string,
  sortBy: ParentsSortBy,
  sortOrder: ParentsSortOrder,
  statusFilter: PersonStatusFilter,
): DashboardParentsQuery {
  const query: DashboardParentsQuery = { page, limit, sortBy, sortOrder };

  if (appliedSearch) {
    query.search = appliedSearch;
  }
  if (statusFilter !== "all") {
    query.status = statusFilter;
  }

  return query;
}

function isParentActive(status?: boolean) {
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
  column: ParentsSortBy;
  sortBy: ParentsSortBy;
  sortOrder: ParentsSortOrder;
  onSort: (column: ParentsSortBy) => void;
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

function ActionButton({
  label,
  onClick,
  tone = "default",
  disabled,
  children,
}: {
  label: string;
  onClick?: () => void;
  tone?: "default" | "danger";
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl border bg-white transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50 ${
        tone === "danger"
          ? "border-red-200 text-red-600 hover:bg-red-50"
          : "border-border text-foreground hover:bg-primary-soft hover:text-primary"
      }`}
    >
      {children}
    </button>
  );
}

function ChildrenDrawer({
  parentId,
  parentName,
  childrenCount,
  onClose,
}: {
  parentId: number;
  parentName?: string;
  childrenCount?: number;
  onClose: () => void;
}) {
  const { data, error, isLoading, isFetching } = useGetChildrenQuery({
    parentId,
    page: 1,
    limit: 100,
  });

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

  const items = data?.items ?? [];
  const total = data?.pagination.total ?? childrenCount ?? items.length;
  const title = items[0]?.parentName ?? parentName ?? "Parent";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <button
        type="button"
        aria-label="Close children list"
        className="absolute inset-0 cursor-pointer bg-black/40"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="children-drawer-title"
        className="relative z-10 w-full max-h-[90dvh] max-w-3xl overflow-y-auto rounded-3xl bg-surface p-6 shadow-xl sm:p-8"
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              Children in this school
            </p>
            <h2
              id="children-drawer-title"
              className="mt-1 text-2xl font-semibold text-foreground"
            >
              {title}
            </h2>
            <p className="mt-1 text-sm text-muted">
              {total} {total === 1 ? "child" : "children"}
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
        <div className="overflow-hidden rounded-2xl border border-border bg-white">
          {isLoading ? (
            <p className="px-5 py-8 text-center text-sm text-muted">
              Loading children…
            </p>
          ) : error ? (
            <p className="px-5 py-8 text-center text-sm text-red-600" role="alert">
              {getApiErrorMessage(error, "Could not load children")}
            </p>
          ) : items.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-muted">
              This parent has no children in this school yet.
            </p>
          ) : (
            <div className={`overflow-x-auto ${isFetching ? "opacity-70" : ""}`}>
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-stone-200">
                    <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-muted">
                      ID
                    </th>
                    <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-muted">
                      Name
                    </th>
                    <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-muted">
                      Class
                    </th>
                    <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-muted">
                      Section
                    </th>
                    <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-muted">
                      Year
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((child) => (
                    <tr
                      key={child.id}
                      className="border-b border-stone-100 last:border-b-0"
                    >
                      <td className="whitespace-nowrap px-5 py-4 font-semibold text-foreground">
                        {child.id}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 font-semibold text-foreground">
                        <Link
                          href={`/students/${child.id}/edit`}
                          className="text-primary underline-offset-2 hover:underline"
                        >
                          <NameWithInitials
                            firstName={child.firstName}
                            lastName={child.lastName}
                            name={child.fullName}
                          />
                        </Link>
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-foreground">
                        {child.className ?? "—"}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-foreground">
                        {child.sectionName ?? "—"}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-foreground">
                        {child.yearTitle ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="border-t border-border p-4">
            <Link
              href={`/students/add?parentId=${parentId}`}
              className="inline-flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary text-sm font-medium text-on-primary transition-colors duration-200 hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:w-auto sm:px-5"
            >
              <Plus aria-hidden className="h-4 w-4" />
              Add children
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ParentsTable() {
  const dispatch = useAppDispatch();
  const ready = useAppSelector(selectAuthReady);
  const accessToken = useAppSelector(selectAccessToken);
  const searchInput = useAppSelector(selectParentsSearchInput);
  const appliedSearch = useAppSelector(selectParentsAppliedSearch);
  const page = useAppSelector(selectParentsPage);
  const limit = useAppSelector(selectParentsLimit);
  const sortBy = useAppSelector(selectParentsSortBy);
  const sortOrder = useAppSelector(selectParentsSortOrder);
  const statusFilter = useAppSelector(selectParentsStatusFilter);
  const selectedParentId = useAppSelector(selectSelectedParentId);
  const prefetchParents = parentsApi.usePrefetch("getParents");
  const [deleteParent, deleteState] = useDeleteParentMutation();
  const [updateParentStatus, statusState] = useUpdateParentStatusMutation();
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<{
    id: number;
    fullName: string;
    childrenCount: number;
  } | null>(null);

  const query = buildParentsQuery(
    page,
    limit,
    appliedSearch,
    sortBy,
    sortOrder,
    statusFilter,
  );
  const canFetch = ready && Boolean(accessToken);

  const { data, error, isLoading, isFetching } = useGetParentsQuery(query, {
    skip: !canFetch,
  });

  useEffect(() => {
    const totalPages = data?.pagination.totalPages ?? 0;
    if (!canFetch || totalPages < page + 1) {
      return;
    }

    prefetchParents(
      buildParentsQuery(
        page + 1,
        limit,
        appliedSearch,
        sortBy,
        sortOrder,
        statusFilter,
      ),
    );
  }, [
    appliedSearch,
    canFetch,
    data?.pagination.totalPages,
    limit,
    page,
    prefetchParents,
    sortBy,
    sortOrder,
    statusFilter,
  ]);

  const parents = data?.items ?? [];
  const pagination = data?.pagination;
  const selectedParent = parents.find((parent) => parent.id === selectedParentId);
  const totalPages = pagination?.totalPages ?? 0;

  function askDeleteParent(parent: {
    id: number;
    fullName: string;
    childrenCount: number;
  }) {
    setDeleteError(null);
    setPendingDelete(parent);
  }

  async function confirmDeleteParent() {
    if (!pendingDelete) {
      return;
    }

    setDeleteError(null);
    try {
      await deleteParent(pendingDelete.id).unwrap();
      if (selectedParentId === pendingDelete.id) {
        dispatch(clearSelectedParent());
      }
      setPendingDelete(null);
    } catch (caught) {
      setDeleteError(getApiErrorMessage(caught, "Could not delete parent"));
    }
  }

  async function toggleParentStatus(parent: { id: number; status?: boolean }) {
    setStatusError(null);
    try {
      await updateParentStatus({
        id: parent.id,
        status: !isParentActive(parent.status),
      }).unwrap();
    } catch (caught) {
      setStatusError(getApiErrorMessage(caught, "Could not update parent status"));
    }
  }

  return (
    <>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex w-full min-w-0 flex-col gap-3 sm:flex-row sm:items-center">
          <TableSearchBar
            label="Search parents"
            placeholder="Search by name or id"
            value={searchInput}
            onChange={(value) => dispatch(setParentsSearchInput(value))}
            onSearch={() => dispatch(applyParentsSearch())}
          />
          <StatusFilterSelect
            value={statusFilter}
            onChange={(next) => dispatch(setParentsStatusFilter(next))}
          />
        </div>
        <Link
          href="/parents/add"
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
                  onSort={(column) => dispatch(setParentsSort(column))}
                />
                <SortHeader
                  label="Full name"
                  column="name"
                  sortBy={sortBy}
                  sortOrder={sortOrder}
                  onSort={(column) => dispatch(setParentsSort(column))}
                />
                <SortHeader
                  label="Address"
                  column="address"
                  sortBy={sortBy}
                  sortOrder={sortOrder}
                  onSort={(column) => dispatch(setParentsSort(column))}
                />
                <SortHeader
                  label="Phone number"
                  column="phone"
                  sortBy={sortBy}
                  sortOrder={sortOrder}
                  onSort={(column) => dispatch(setParentsSort(column))}
                />
                <SortHeader
                  label="Children in school"
                  column="childrenCount"
                  sortBy={sortBy}
                  sortOrder={sortOrder}
                  onSort={(column) => dispatch(setParentsSort(column))}
                />
                <IconColumnHeader label="Status">
                  <Pause aria-hidden className="h-4 w-4" />
                </IconColumnHeader>
                <IconColumnHeader label="Has children">
                  <User aria-hidden className="h-4 w-4" />
                </IconColumnHeader>
                <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-muted">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-5 py-10 text-center text-sm text-muted"
                  >
                    Loading parents…
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-5 py-10 text-center text-sm text-red-600"
                    role="alert"
                  >
                    {getApiErrorMessage(error, "Could not load parents")}
                  </td>
                </tr>
              ) : parents.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-5 py-10 text-center text-sm text-muted"
                  >
                    No parents match this search.
                  </td>
                </tr>
              ) : (
                parents.map((parent) => (
                  <tr
                    key={parent.id}
                    className={`border-b border-stone-100 last:border-b-0 odd:bg-white even:bg-primary-soft/50 ${
                      isFetching ? "opacity-70" : ""
                    }`}
                  >
                    <td className="whitespace-nowrap px-5 py-4 font-semibold text-foreground">
                      {parent.id}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 font-semibold text-foreground">
                      <NameWithInitials
                        firstName={parent.firstName}
                        lastName={parent.lastName}
                        name={parent.fullName}
                      />
                    </td>
                    <td className="px-5 py-4 text-foreground">
                      {parent.address ?? "—"}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 tabular-nums text-foreground">
                      {parent.phoneNumber ?? "—"}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4">
                      <button
                        type="button"
                        onClick={() => dispatch(selectParent(parent.id))}
                        className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-1.5 rounded-xl px-2 font-semibold tabular-nums text-primary underline-offset-2 transition-colors duration-200 hover:bg-primary-soft hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                      >
                        <User aria-hidden className="h-4 w-4" />
                        ({parent.childrenCount})
                      </button>
                    </td>
                    <td className="px-2 py-4 text-center">
                      <button
                        type="button"
                        aria-pressed={isParentActive(parent.status)}
                        aria-label={
                          isParentActive(parent.status)
                            ? "Active — click to close"
                            : "Closed — click to activate"
                        }
                        title={
                          isParentActive(parent.status)
                            ? "Active — click to close"
                            : "Closed — click to activate"
                        }
                        disabled={statusState.isLoading}
                        onClick={() => void toggleParentStatus(parent)}
                        className="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl hover:bg-primary-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isParentActive(parent.status) ? (
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
                    <td className="px-2 py-4 text-center">
                      <span
                        aria-label={
                          parent.childrenCount > 0
                            ? `${parent.childrenCount} children`
                            : "No children"
                        }
                        title={
                          parent.childrenCount > 0
                            ? `${parent.childrenCount} children in school`
                            : "No children"
                        }
                        className={`inline-flex h-11 w-11 items-center justify-center ${
                          parent.childrenCount > 0
                            ? "text-emerald-600"
                            : "text-muted/40"
                        }`}
                      >
                        <User aria-hidden className="h-5 w-5" />
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/parents/${parent.id}`}
                          aria-label="View"
                          title="View"
                          className="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl border border-border bg-white text-foreground transition-colors duration-200 hover:bg-primary-soft hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                        >
                          <Eye aria-hidden className="h-4 w-4" />
                        </Link>
                        <Link
                          href={`/parents/${parent.id}/edit`}
                          aria-label="Edit"
                          title="Edit"
                          className="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl border border-border bg-white text-foreground transition-colors duration-200 hover:bg-primary-soft hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                        >
                          <Pencil aria-hidden className="h-4 w-4" />
                        </Link>
                        <ActionButton
                          label="Delete"
                          tone="danger"
                          disabled={deleteState.isLoading}
                          onClick={() => askDeleteParent(parent)}
                        >
                          <Trash2 aria-hidden className="h-4 w-4" />
                        </ActionButton>
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
              Page {pagination.page} of {totalPages} · {pagination.total} parents
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={page <= 1 || isFetching}
                onClick={() => dispatch(setParentsPage(page - 1))}
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
                    prefetchParents(
                      buildParentsQuery(
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
                onClick={() => dispatch(setParentsPage(page + 1))}
                className="inline-flex h-11 cursor-pointer items-center gap-1 rounded-xl border border-border px-3 text-sm font-medium hover:bg-primary-soft disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
                <ChevronRight aria-hidden className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : null}
      </article>
      {selectedParentId ? (
        <ChildrenDrawer
          parentId={selectedParentId}
          parentName={selectedParent?.fullName}
          childrenCount={selectedParent?.childrenCount}
          onClose={() => dispatch(clearSelectedParent())}
        />
      ) : null}
      {pendingDelete ? (
        <ConfirmDeleteDialog
          title="Are you sure?"
          description={
            pendingDelete.childrenCount > 0
              ? `Delete ${pendingDelete.fullName}? This also deletes ${pendingDelete.childrenCount} ${pendingDelete.childrenCount === 1 ? "child" : "children"} in this school. This cannot be undone.`
              : `Delete ${pendingDelete.fullName}? This cannot be undone.`
          }
          error={deleteError}
          busy={deleteState.isLoading}
          onCancel={() => {
            if (!deleteState.isLoading) {
              setPendingDelete(null);
              setDeleteError(null);
            }
          }}
          onConfirm={() => void confirmDeleteParent()}
        />
      ) : null}
    </>
  );
}
