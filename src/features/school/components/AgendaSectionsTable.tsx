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
} from "lucide-react";
import { ConfirmDeleteDialog } from "@/components/dashboard/ConfirmDeleteDialog";
import { FilterSelect } from "@/components/dashboard/FilterSelect";
import { TableLoadingRow } from "@/components/dashboard/TableLoading";
import { TablePagination } from "@/components/dashboard/TablePagination";
import { TableSearchBar } from "@/components/dashboard/TableSearchBar";
import { YearFilterSelect } from "@/components/dashboard/YearFilterSelect";
import { getApiErrorMessage } from "@/lib/getApiErrorMessage";
import {
  useDeleteAgendaSectionMutation,
  useGetAgendaSectionsQuery,
} from "@/features/school/api/agendaSectionsApi";
import { useGetClassesQuery } from "@/features/school/api/classesApi";
import { useGetSectionsQuery } from "@/features/school/api/sectionsApi";
import { useSchoolYearFilter } from "@/features/school/useSchoolYearFilter";
import { selectAuthReady, selectAccessToken } from "@/features/auth/authSlice";
import { useAppSelector } from "@/store/hooks";
import type {
  AgendaSectionsSortBy,
  AgendaSectionsSortOrder,
  DashboardAgendaSectionsQuery,
} from "@/features/school/types";

const PAGE_SIZE = 10;

function formatDate(value: string): string {
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
  appliedSectionId: number,
  sortBy: AgendaSectionsSortBy,
  sortOrder: AgendaSectionsSortOrder,
): DashboardAgendaSectionsQuery {
  const query: DashboardAgendaSectionsQuery = {
    page,
    limit: PAGE_SIZE,
    sortBy,
    sortOrder,
  };
  if (appliedSearch) query.search = appliedSearch;
  if (appliedYearId) query.yearId = appliedYearId;
  if (appliedClassId) query.classId = appliedClassId;
  if (appliedSectionId) query.sectionId = appliedSectionId;
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
  column: AgendaSectionsSortBy;
  sortBy: AgendaSectionsSortBy;
  sortOrder: AgendaSectionsSortOrder;
  onSort: (column: AgendaSectionsSortBy) => void;
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

export function AgendaSectionsTable() {
  const ready = useAppSelector(selectAuthReady);
  const accessToken = useAppSelector(selectAccessToken);
  const canFetch = ready && Boolean(accessToken);
  const { years, yearId: defaultYearId } = useSchoolYearFilter(canFetch);

  const [searchInput, setSearchInput] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [draftClassId, setDraftClassId] = useState(0);
  const [draftSectionId, setDraftSectionId] = useState(0);
  const [appliedClassId, setAppliedClassId] = useState(0);
  const [appliedSectionId, setAppliedSectionId] = useState(0);
  const [draftYearId, setDraftYearId] = useState<number | null>(null);
  const [appliedYearId, setAppliedYearId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<AgendaSectionsSortBy>("id");
  const [sortOrder, setSortOrder] = useState<AgendaSectionsSortOrder>("desc");
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    if (!defaultYearId) {
      return;
    }
    setDraftYearId((current) => current ?? defaultYearId);
    setAppliedYearId((current) => current ?? defaultYearId);
  }, [defaultYearId]);

  const resolvedYearId = appliedYearId ?? defaultYearId;
  const draftResolvedYearId = draftYearId ?? defaultYearId;

  const { data: classesData } = useGetClassesQuery(
    { page: 1, limit: 20, sortOrder: "asc" },
    { skip: !canFetch },
  );
  const { data: sectionsData } = useGetSectionsQuery(
    {
      page: 1,
      limit: 20,
      yearId: draftResolvedYearId ?? undefined,
      classId: draftClassId || undefined,
      sortBy: "section",
      sortOrder: "asc",
    },
    { skip: !canFetch || !draftResolvedYearId },
  );

  const classes = classesData?.items ?? [];
  const sections = sectionsData?.items ?? [];

  const query = buildQuery(
    page,
    appliedSearch,
    resolvedYearId,
    appliedClassId,
    appliedSectionId,
    sortBy,
    sortOrder,
  );

  const { data, error, isLoading, isFetching } = useGetAgendaSectionsQuery(
    query,
    { skip: !canFetch || !resolvedYearId },
  );
  const [deleteAgendaSection, deleteState] = useDeleteAgendaSectionMutation();

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 0;

  function applyFilters() {
    setAppliedSearch(searchInput.trim());
    setAppliedClassId(draftClassId);
    setAppliedSectionId(draftSectionId);
    setAppliedYearId(draftYearId);
    setPage(1);
  }

  function handleSort(column: AgendaSectionsSortBy) {
    if (sortBy === column) {
      setSortOrder((current) => (current === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
    setPage(1);
  }

  async function confirmDelete() {
    if (deleteId == null) {
      return;
    }
    setDeleteError(null);
    try {
      await deleteAgendaSection(deleteId).unwrap();
      setDeleteId(null);
    } catch (caught) {
      setDeleteError(
        getApiErrorMessage(caught, "Could not delete agenda section"),
      );
    }
  }

  return (
    <div>
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <TableSearchBar
          label="Search agenda sections"
          placeholder="Search by agenda description"
          value={searchInput}
          onChange={setSearchInput}
          onSearch={applyFilters}
        >
          <YearFilterSelect
            years={years}
            value={draftYearId ?? defaultYearId}
            onChange={(yearId) => {
              setDraftYearId(yearId);
              setDraftSectionId(0);
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
        </TableSearchBar>
        <Link
          href="/agenda/sections/add"
          className="inline-flex h-11 shrink-0 cursor-pointer items-center justify-center gap-2 self-start rounded-lg bg-primary px-4 text-sm font-medium text-on-primary hover:bg-primary-hover"
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
                  label="Date"
                  column="agendaDate"
                  sortBy={sortBy}
                  sortOrder={sortOrder}
                  onSort={handleSort}
                />
                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-muted">
                  Agenda
                </th>
                <SortHeader
                  label="Section"
                  column="section"
                  sortBy={sortBy}
                  sortOrder={sortOrder}
                  onSort={handleSort}
                />
                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-muted">
                  Class
                </th>
                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-muted">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading || !resolvedYearId ? (
                <TableLoadingRow colSpan={6} label="Loading agenda sections" />
              ) : error ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-10 text-center text-sm text-red-600"
                    role="alert"
                  >
                    {getApiErrorMessage(
                      error,
                      "Could not load agenda sections",
                    )}
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-10 text-center text-sm text-muted"
                  >
                    No agenda sections found. Click Add to create one.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr
                    key={item.id}
                    className={`border-b border-stone-100 last:border-b-0 odd:bg-white even:bg-primary-soft/50 ${isFetching ? "opacity-70" : ""}`}
                  >
                    <td className="whitespace-nowrap px-5 py-4 font-semibold">
                      {item.id}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-foreground">
                      {formatDate(item.agendaDate)}
                    </td>
                    <td className="max-w-xs truncate px-5 py-4 text-foreground">
                      {item.agendaDescription}
                      <span className="mt-0.5 block text-xs text-muted">
                        {item.courseTitle}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-foreground">
                      {item.sectionTitle}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-foreground">
                      {item.className}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/agenda/sections/${item.id}`}
                          className="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl border border-border bg-white text-foreground transition-colors hover:bg-primary-soft hover:text-primary"
                          aria-label={`View agenda section ${item.id}`}
                          title="View"
                        >
                          <Eye aria-hidden className="h-4 w-4" />
                        </Link>
                        <Link
                          href={`/agenda/sections/${item.id}/edit`}
                          className="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl border border-border bg-white text-foreground transition-colors hover:bg-primary-soft hover:text-primary"
                          aria-label={`Edit agenda section ${item.id}`}
                          title="Edit"
                        >
                          <Pencil aria-hidden className="h-4 w-4" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => {
                            setDeleteError(null);
                            setDeleteId(item.id);
                          }}
                          className="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl border border-border bg-white text-red-600 transition-colors hover:bg-red-50"
                          aria-label={`Remove agenda section ${item.id}`}
                          title="Remove"
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

        {totalPages > 0 ? (
          <TablePagination
            page={page}
            totalPages={totalPages}
            total={total}
            label="records"
            disabled={isFetching}
            onPageChange={(next) => setPage(next)}
          />
        ) : null}
      </article>

      {deleteId != null ? (
        <ConfirmDeleteDialog
          title="Remove agenda section?"
          description="This assignment will be removed from the agenda."
          confirmLabel={deleteState.isLoading ? "Removing…" : "Remove"}
          busy={deleteState.isLoading}
          error={deleteError}
          onCancel={() => {
            setDeleteId(null);
            setDeleteError(null);
          }}
          onConfirm={() => void confirmDelete()}
        />
      ) : null}
    </div>
  );
}
