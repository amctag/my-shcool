"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowDown,
  ArrowRightLeft,
  ArrowUp,
  Check,
  ChevronDown,
  ChevronUp,
  Minus,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { ConfirmDeleteDialog } from "@/components/dashboard/ConfirmDeleteDialog";
import { FilterSelect } from "@/components/dashboard/FilterSelect";
import { TableExportButtons } from "@/components/dashboard/TableExportButtons";
import { TableLoadingRow } from "@/components/dashboard/TableLoading";
import { TablePagination } from "@/components/dashboard/TablePagination";
import { TableSearchBar } from "@/components/dashboard/TableSearchBar";
import { getApiErrorMessage } from "@/lib/getApiErrorMessage";
import { fetchAllPaginatedItems } from "@/lib/exportTable";
import { useGetClassesQuery } from "@/features/school/api/classesApi";
import { useGetSectionsQuery } from "@/features/school/api/sectionsApi";
import {
  useDeleteRegistrationMutation,
  useGetRegistrationsQuery,
  useLazyGetRegistrationsQuery,
} from "@/features/school/api/registrationsApi";
import {
  RegistrationProgressDrawer,
  type RegistrationProgressTarget,
} from "@/features/school/components/RegistrationProgressDrawer";
import { RegistrationMoveSectionDrawer } from "@/features/school/components/RegistrationMoveSectionDrawer";
import { useSchoolYearFilter } from "@/features/school/useSchoolYearFilter";
import { selectAuthReady, selectAccessToken } from "@/features/auth/authSlice";
import { useAppSelector } from "@/store/hooks";
import type {
  DashboardRegistration,
  DashboardRegistrationsQuery,
  RegistrationProgressAction,
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
  appliedFirstName: string,
  appliedMiddleName: string,
  appliedLastName: string,
  yearId: number | null,
  appliedClassId: number,
  appliedSectionId: number,
  sortBy: RegistrationsSortBy,
  sortOrder: RegistrationsSortOrder,
  limit = PAGE_SIZE,
): DashboardRegistrationsQuery {
  const query: DashboardRegistrationsQuery = {
    page,
    limit,
    sortBy,
    sortOrder,
  };
  if (appliedFirstName) {
    query.firstName = appliedFirstName;
  }
  if (appliedMiddleName) {
    query.middleName = appliedMiddleName;
  }
  if (appliedLastName) {
    query.lastName = appliedLastName;
  }
  if (yearId) {
    query.yearId = yearId;
  }
  if (appliedClassId) {
    query.classId = appliedClassId;
  }
  if (appliedSectionId) {
    query.sectionId = appliedSectionId;
  }
  return query;
}

function toProgressTarget(
  item: DashboardRegistration,
): RegistrationProgressTarget {
  return {
    id: item.id,
    studentName: item.studentName,
    className: item.className,
    classLevel: item.classLevel,
  };
}

function TableCheckbox({
  checked,
  indeterminate = false,
  disabled,
  onChange,
  "aria-label": ariaLabel,
}: {
  checked: boolean;
  indeterminate?: boolean;
  disabled?: boolean;
  onChange: () => void;
  "aria-label": string;
}) {
  return (
    <label
      className={`inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl transition-colors duration-200 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-ring ${
        disabled
          ? "cursor-not-allowed opacity-50"
          : "hover:bg-primary-soft"
      }`}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        ref={(element) => {
          if (element) {
            element.indeterminate = indeterminate;
          }
        }}
        onChange={onChange}
        className="peer sr-only"
        aria-label={ariaLabel}
      />
      <span
        aria-hidden
        className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors duration-200 ${
          checked || indeterminate
            ? "border-primary bg-primary text-on-primary"
            : "border-border bg-white"
        }`}
      >
        {checked ? (
          <Check className="h-3.5 w-3.5 stroke-[3]" />
        ) : indeterminate ? (
          <Minus className="h-3.5 w-3.5 stroke-[3]" />
        ) : null}
      </span>
    </label>
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
  const { yearId } = useSchoolYearFilter(canFetch);

  const [firstNameInput, setFirstNameInput] = useState("");
  const [middleNameInput, setMiddleNameInput] = useState("");
  const [lastNameInput, setLastNameInput] = useState("");
  const [appliedFirstName, setAppliedFirstName] = useState("");
  const [appliedMiddleName, setAppliedMiddleName] = useState("");
  const [appliedLastName, setAppliedLastName] = useState("");
  const [draftClassId, setDraftClassId] = useState(0);
  const [appliedClassId, setAppliedClassId] = useState(0);
  const [draftSectionId, setDraftSectionId] = useState(0);
  const [appliedSectionId, setAppliedSectionId] = useState(0);
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<RegistrationsSortBy>("id");
  const [sortOrder, setSortOrder] = useState<RegistrationsSortOrder>("desc");
  const [actionError, setActionError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [progressAction, setProgressAction] =
    useState<RegistrationProgressAction | null>(null);
  const [pendingDelete, setPendingDelete] = useState<{
    id: number;
    name: string;
  } | null>(null);
  const [pendingMove, setPendingMove] =
    useState<DashboardRegistration | null>(null);

  useEffect(() => {
    setPage(1);
    setSelectedIds([]);
    setDraftSectionId(0);
    setAppliedSectionId(0);
  }, [yearId]);

  const { data: classesData } = useGetClassesQuery(
    { page: 1, limit: 20, sortOrder: "asc" },
    { skip: !canFetch },
  );
  const classes = classesData?.items ?? [];
  const classSelected = draftClassId > 0;

  const { data: sectionsData, isFetching: sectionsLoading } = useGetSectionsQuery(
    {
      page: 1,
      limit: 50,
      yearId: yearId ?? undefined,
      classId: draftClassId,
      sortBy: "section",
      sortOrder: "asc",
    },
    { skip: !canFetch || !yearId || !classSelected },
  );
  const sections = sectionsData?.items ?? [];

  const { data, error, isLoading, isFetching } = useGetRegistrationsQuery(
    buildQuery(
      page,
      appliedFirstName,
      appliedMiddleName,
      appliedLastName,
      yearId,
      appliedClassId,
      appliedSectionId,
      sortBy,
      sortOrder,
    ),
    { skip: !canFetch || !yearId },
  );
  const [fetchRegistrations] = useLazyGetRegistrationsQuery();

  const [deleteRegistration, deleteState] = useDeleteRegistrationMutation();

  async function fetchExportRows() {
    const rows = await fetchAllPaginatedItems(async (exportPage, exportLimit) =>
      fetchRegistrations(
        buildQuery(
          exportPage,
          appliedFirstName,
          appliedMiddleName,
          appliedLastName,
          yearId,
          appliedClassId,
          appliedSectionId,
          sortBy,
          sortOrder,
          exportLimit,
        ),
      ).unwrap(),
    );

    return rows.map((item) => ({
      id: item.id,
      student: item.studentName,
      class: item.className,
      level: item.classLevel,
      section: item.sectionTitle,
      year: item.yearTitle,
      date: formatDate(item.createdAt),
    }));
  }

  const items = data?.items ?? [];
  const totalPages = data?.pagination.totalPages ?? 0;
  const pageIds = useMemo(() => items.map((item) => item.id), [items]);
  const selectedOnPage = pageIds.filter((id) => selectedIds.includes(id));
  const allPageSelected =
    pageIds.length > 0 && selectedOnPage.length === pageIds.length;
  const somePageSelected =
    selectedOnPage.length > 0 && selectedOnPage.length < pageIds.length;

  const selectedTargets = useMemo(() => {
    const byId = new Map(items.map((item) => [item.id, item]));
    return selectedIds
      .map((id) => byId.get(id))
      .filter((item): item is DashboardRegistration => Boolean(item))
      .map(toProgressTarget);
  }, [items, selectedIds]);

  function handleSort(column: RegistrationsSortBy) {
    setPage(1);
    setSelectedIds([]);
    if (sortBy === column) {
      setSortOrder((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }
    setSortBy(column);
    setSortOrder("asc");
  }

  function toggleRow(id: number) {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  }

  function toggleAllOnPage() {
    if (allPageSelected) {
      setSelectedIds((current) =>
        current.filter((id) => !pageIds.includes(id)),
      );
      return;
    }
    setSelectedIds((current) => [
      ...current.filter((id) => !pageIds.includes(id)),
      ...pageIds,
    ]);
  }

  async function confirmDelete() {
    if (!pendingDelete) {
      return;
    }
    setActionError(null);
    try {
      await deleteRegistration(pendingDelete.id).unwrap();
      setSelectedIds((current) =>
        current.filter((id) => id !== pendingDelete.id),
      );
      setPendingDelete(null);
    } catch (caught) {
      setActionError(
        getApiErrorMessage(caught, "Could not delete registration"),
      );
    }
  }

  function applySearch() {
    const nextFirstName = firstNameInput.trim();
    const nextMiddleName = middleNameInput.trim();
    const nextLastName = lastNameInput.trim();
    const nextSectionId = draftClassId > 0 ? draftSectionId : 0;
    if (
      nextFirstName === appliedFirstName &&
      nextMiddleName === appliedMiddleName &&
      nextLastName === appliedLastName &&
      draftClassId === appliedClassId &&
      nextSectionId === appliedSectionId
    ) {
      return;
    }
    setPage(1);
    setSelectedIds([]);
    setAppliedFirstName(nextFirstName);
    setAppliedMiddleName(nextMiddleName);
    setAppliedLastName(nextLastName);
    setAppliedClassId(draftClassId);
    setAppliedSectionId(nextSectionId);
    if (draftClassId <= 0) {
      setDraftSectionId(0);
      setProgressAction(null);
    }
  }

  const classFilterActive = appliedClassId > 0;
  const bulkDisabled = !classFilterActive || selectedTargets.length === 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <TableSearchBar hideInput onSearch={applySearch} compact>
          <label className="relative w-full min-w-0 shrink-0 sm:w-36">
            <span className="sr-only">First name</span>
            <input
              type="search"
              value={firstNameInput}
              onChange={(event) => setFirstNameInput(event.target.value)}
              placeholder="First name"
              className="h-11 w-full min-w-28 rounded-lg border border-border bg-white px-3 text-sm outline-none transition-colors duration-200 focus:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            />
          </label>
          <label className="relative w-full min-w-0 shrink-0 sm:w-36">
            <span className="sr-only">Middle name</span>
            <input
              type="search"
              value={middleNameInput}
              onChange={(event) => setMiddleNameInput(event.target.value)}
              placeholder="Middle name"
              className="h-11 w-full min-w-28 rounded-lg border border-border bg-white px-3 text-sm outline-none transition-colors duration-200 focus:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            />
          </label>
          <label className="relative w-full min-w-0 shrink-0 sm:w-36">
            <span className="sr-only">Family name</span>
            <input
              type="search"
              value={lastNameInput}
              onChange={(event) => setLastNameInput(event.target.value)}
              placeholder="Family"
              className="h-11 w-full min-w-28 rounded-lg border border-border bg-white px-3 text-sm outline-none transition-colors duration-200 focus:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            />
          </label>
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
            onChange={(classId) => {
              setDraftClassId(classId);
              setDraftSectionId(0);
            }}
          />
          <FilterSelect
            label="Section"
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
        <div className="flex flex-wrap items-center justify-end gap-2">
          <TableExportButtons
            title="Registrations"
            filename="registrations"
            columns={[
              { key: "id", header: "ID" },
              { key: "student", header: "Student" },
              { key: "class", header: "Class" },
              { key: "level", header: "Level" },
              { key: "section", header: "Section" },
              { key: "year", header: "Year" },
              { key: "date", header: "Date" },
            ]}
            fetchRows={fetchExportRows}
            disabled={!canFetch || !yearId}
          />
          <Link
            href="/registrations/add"
            className="inline-flex h-11 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-on-primary hover:bg-primary-hover"
          >
            <Plus aria-hidden className="h-4 w-4" />
            Add
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-white px-4 py-3 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <p className="me-auto text-sm text-muted">
          {!classFilterActive
            ? "Filter by class and click Search before using Up, Re-registration, or Down"
            : selectedTargets.length > 0
              ? `${selectedTargets.length} selected on this page`
              : "Select students, then choose Up, Re-registration, or Down"}
        </p>
        <button
          type="button"
          disabled={bulkDisabled}
          onClick={() => setProgressAction("up")}
          className="inline-flex h-9 cursor-pointer items-center gap-1 rounded-lg border border-border bg-white px-3 text-xs font-semibold text-foreground transition-colors hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ArrowUp aria-hidden className="h-3.5 w-3.5" />
          Up
        </button>
        <button
          type="button"
          disabled={bulkDisabled}
          onClick={() => setProgressAction("stay")}
          className="inline-flex h-9 cursor-pointer items-center gap-1 rounded-lg border border-border bg-white px-3 text-xs font-semibold text-foreground transition-colors hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw aria-hidden className="h-3.5 w-3.5" />
          Re-registration
        </button>
        <button
          type="button"
          disabled={bulkDisabled}
          onClick={() => setProgressAction("down")}
          className="inline-flex h-9 cursor-pointer items-center gap-1 rounded-lg border border-border bg-white px-3 text-xs font-semibold text-foreground transition-colors hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ArrowDown aria-hidden className="h-3.5 w-3.5" />
          Down
        </button>
      </div>

      {actionError ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {actionError}
        </p>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-stone-100 bg-stone-50/80">
              <tr>
                <th className="w-14 px-2 py-2">
                  <TableCheckbox
                    checked={allPageSelected}
                    indeterminate={somePageSelected}
                    disabled={!classFilterActive || pageIds.length === 0}
                    onChange={toggleAllOnPage}
                    aria-label="Select all on this page"
                  />
                </th>
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
              {isLoading || !yearId ? (
                <TableLoadingRow colSpan={8} label="Loading registrations" />
              ) : error ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-5 py-10 text-center text-sm text-red-600"
                    role="alert"
                  >
                    {getApiErrorMessage(error, "Could not load registrations")}
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-5 py-10 text-center text-sm text-muted"
                  >
                    No registrations found. Click Add to create one.
                  </td>
                </tr>
              ) : (
                items.map((item) => {
                  const checked = selectedIds.includes(item.id);
                  return (
                    <tr
                      key={item.id}
                      className={`border-b border-stone-100 last:border-b-0 odd:bg-white even:bg-primary-soft/50 ${isFetching ? "opacity-70" : ""} ${checked ? "bg-primary-soft/70" : ""}`}
                    >
                      <td className="w-14 px-2 py-2">
                        <TableCheckbox
                          checked={checked}
                          disabled={!classFilterActive}
                          onChange={() => toggleRow(item.id)}
                          aria-label={`Select ${item.studentName}`}
                        />
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 font-semibold text-foreground">
                        {item.id}
                      </td>
                      <td className="px-5 py-4 font-medium text-foreground">
                        <Link
                          href={`/students/${item.studentId}`}
                          className="cursor-pointer font-medium text-primary underline-offset-2 transition-colors duration-200 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                        >
                          {item.studentName}
                        </Link>
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-foreground">
                        <div className="leading-tight">
                          <div>{item.className}</div>
                          <div className="text-xs text-muted">
                            Level {item.classLevel}
                          </div>
                        </div>
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
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setPendingMove(item)}
                            className="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl border border-border bg-white text-foreground transition-colors hover:bg-primary-soft hover:text-primary"
                            aria-label={`Move ${item.studentName} to another section`}
                            title="Move section"
                          >
                            <ArrowRightLeft aria-hidden className="h-4 w-4" />
                          </button>
                          <Link
                            href={`/registrations/${item.id}/edit`}
                            className="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl border border-border bg-white text-foreground transition-colors hover:bg-primary-soft hover:text-primary"
                            aria-label={`Edit registration for ${item.studentName}`}
                            title="Edit"
                          >
                            <Pencil aria-hidden className="h-4 w-4" />
                          </Link>
                          <button
                            type="button"
                            onClick={() =>
                              setPendingDelete({
                                id: item.id,
                                name: item.studentName,
                              })
                            }
                            className="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl border border-border bg-white text-red-600 transition-colors hover:bg-red-50"
                            aria-label={`Delete registration for ${item.studentName}`}
                            title="Delete"
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

        {totalPages > 0 ? (
          <TablePagination
            page={page}
            totalPages={totalPages}
            onPageChange={(next) => {
              setPage(next);
              setSelectedIds([]);
            }}
          />
        ) : null}
      </div>

      {progressAction && selectedTargets.length > 0 ? (
        <RegistrationProgressDrawer
          action={progressAction}
          targets={selectedTargets}
          onClose={() => setProgressAction(null)}
          onDone={() => {
            setProgressAction(null);
            setSelectedIds([]);
          }}
        />
      ) : null}

      {pendingMove ? (
        <RegistrationMoveSectionDrawer
          registration={pendingMove}
          onClose={() => setPendingMove(null)}
          onDone={() => setPendingMove(null)}
        />
      ) : null}

      {pendingDelete ? (
        <ConfirmDeleteDialog
          title="Delete registration"
          description={`Remove registration for ${pendingDelete.name}?`}
          busy={deleteState.isLoading}
          onCancel={() => setPendingDelete(null)}
          onConfirm={() => void confirmDelete()}
        />
      ) : null}
    </div>
  );
}
