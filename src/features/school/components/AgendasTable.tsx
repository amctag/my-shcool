"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
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
  useDeleteDashboardAgendaMutation,
  useGetDashboardAgendasQuery,
} from "@/features/school/api/agendasApi";
import { useGetClassesQuery } from "@/features/school/api/classesApi";
import { useGetClassCoursesQuery } from "@/features/school/api/coursesApi";
import { useGetSectionsQuery } from "@/features/school/api/sectionsApi";
import { useSchoolYearFilter } from "@/features/school/useSchoolYearFilter";
import { selectAuthReady, selectAccessToken } from "@/features/auth/authSlice";
import { useAppSelector } from "@/store/hooks";
import type {
  AgendasSortBy,
  AgendasSortOrder,
  DashboardAgendasQuery,
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
  appliedCourseId: number,
  appliedStatus: string,
  sortBy: AgendasSortBy,
  sortOrder: AgendasSortOrder,
): DashboardAgendasQuery {
  const query: DashboardAgendasQuery = {
    page,
    limit: PAGE_SIZE,
    sortBy,
    sortOrder,
  };
  if (appliedSearch) query.search = appliedSearch;
  if (appliedYearId) query.yearId = appliedYearId;
  if (appliedClassId) query.classId = appliedClassId;
  if (appliedSectionId) query.sectionId = appliedSectionId;
  if (appliedCourseId) query.courseId = appliedCourseId;
  if (appliedStatus === "1" || appliedStatus === "0") {
    query.status = Number(appliedStatus);
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
  column: AgendasSortBy;
  sortBy: AgendasSortBy;
  sortOrder: AgendasSortOrder;
  onSort: (column: AgendasSortBy) => void;
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

export function AgendasTable() {
  const searchParams = useSearchParams();
  const ready = useAppSelector(selectAuthReady);
  const accessToken = useAppSelector(selectAccessToken);
  const canFetch = ready && Boolean(accessToken);
  const { years, yearId: defaultYearId } = useSchoolYearFilter(canFetch);

  const savedMessage = searchParams.get("saved") === "1";

  const [searchInput, setSearchInput] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [draftClassId, setDraftClassId] = useState(0);
  const [draftSectionId, setDraftSectionId] = useState(0);
  const [draftCourseId, setDraftCourseId] = useState(0);
  const [draftStatus, setDraftStatus] = useState("");
  const [appliedClassId, setAppliedClassId] = useState(0);
  const [appliedSectionId, setAppliedSectionId] = useState(0);
  const [appliedCourseId, setAppliedCourseId] = useState(0);
  const [appliedStatus, setAppliedStatus] = useState("");
  const [draftYearId, setDraftYearId] = useState<number | null>(null);
  const [appliedYearId, setAppliedYearId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<AgendasSortBy>("agendaDate");
  const [sortOrder, setSortOrder] = useState<AgendasSortOrder>("desc");
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
    { page: 1, limit: 100, sortOrder: "asc" },
    { skip: !canFetch },
  );
  const { data: sectionsData } = useGetSectionsQuery(
    {
      page: 1,
      limit: 100,
      yearId: draftResolvedYearId ?? undefined,
      classId: draftClassId || undefined,
      sortBy: "section",
      sortOrder: "asc",
    },
    { skip: !canFetch || !draftResolvedYearId },
  );
  const { data: classCoursesData } = useGetClassCoursesQuery(
    {
      page: 1,
      limit: 100,
      classId: draftClassId,
      yearId: draftResolvedYearId ?? undefined,
      status: "active",
      sortBy: "course",
      sortOrder: "asc",
    },
    { skip: !canFetch || !draftResolvedYearId || draftClassId <= 0 },
  );

  const classes = classesData?.items ?? [];
  const sections = sectionsData?.items ?? [];
  const courses = classCoursesData?.items ?? [];

  const query = buildQuery(
    page,
    appliedSearch,
    resolvedYearId,
    appliedClassId,
    appliedSectionId,
    appliedCourseId,
    appliedStatus,
    sortBy,
    sortOrder,
  );

  const { data, error, isLoading, isFetching } = useGetDashboardAgendasQuery(
    query,
    {
      skip: !canFetch || !resolvedYearId,
    },
  );
  const [deleteAgenda, deleteState] = useDeleteDashboardAgendaMutation();

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 0;

  function applyFilters() {
    setAppliedSearch(searchInput.trim());
    setAppliedClassId(draftClassId);
    setAppliedSectionId(draftSectionId);
    setAppliedCourseId(draftCourseId);
    setAppliedStatus(draftStatus);
    setAppliedYearId(draftYearId);
    setPage(1);
  }

  function handleSort(column: AgendasSortBy) {
    if (sortBy === column) {
      setSortOrder((current) => (current === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(column);
      setSortOrder(column === "agendaDate" ? "desc" : "asc");
    }
    setPage(1);
  }

  async function confirmDelete() {
    if (deleteId == null) {
      return;
    }
    setDeleteError(null);
    try {
      await deleteAgenda(deleteId).unwrap();
      setDeleteId(null);
    } catch (caught) {
      setDeleteError(getApiErrorMessage(caught, "Could not delete agenda"));
    }
  }

  return (
    <div>
      {savedMessage ? (
        <p className="mb-4 rounded-xl bg-primary-soft px-4 py-3 text-sm text-primary">
          Agenda saved.
        </p>
      ) : null}
      <div className="mb-5 flex flex-nowrap items-center gap-3 overflow-x-auto pb-1">
        <TableSearchBar
          label="Search agendas"
          placeholder="Search by description"
          value={searchInput}
          onChange={setSearchInput}
          onSearch={applyFilters}
          compact
          nowrap
        >
          <YearFilterSelect
            years={years}
            value={draftYearId ?? defaultYearId}
            onChange={(yearId) => {
              setDraftYearId(yearId);
              setDraftSectionId(0);
              setDraftCourseId(0);
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
              setDraftCourseId(0);
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
          <FilterSelect
            label="Course"
            value={draftCourseId}
            disabled={draftClassId <= 0}
            options={
              draftClassId <= 0
                ? [{ value: 0, label: "Select a class first" }]
                : [
                    { value: 0, label: "All courses" },
                    ...courses.map((item) => ({
                      value: item.courseId,
                      label: item.courseTitle,
                    })),
                  ]
            }
            onChange={setDraftCourseId}
          />
          <FilterSelect
            label="Status"
            value={draftStatus}
            options={[
              { value: "", label: "All statuses" },
              { value: "1", label: "Active" },
              { value: "0", label: "Inactive" },
            ]}
            onChange={setDraftStatus}
          />
        </TableSearchBar>
        <Link
          href="/agenda/add"
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
                  label="Date"
                  column="agendaDate"
                  sortBy={sortBy}
                  sortOrder={sortOrder}
                  onSort={handleSort}
                />
                <SortHeader
                  label="Course"
                  column="course"
                  sortBy={sortBy}
                  sortOrder={sortOrder}
                  onSort={handleSort}
                />
                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-muted">
                  Title
                </th>
                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-muted">
                  Sections
                </th>
                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-muted">
                  Description
                </th>
                <SortHeader
                  label="Status"
                  column="status"
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
                <TableLoadingRow colSpan={7} label="Loading agendas" />
              ) : error ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-10 text-center text-sm text-red-600"
                    role="alert"
                  >
                    {getApiErrorMessage(error, "Could not load agendas")}
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-10 text-center text-sm text-muted"
                  >
                    No agendas found. Click Add to create one.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr
                    key={item.id}
                    className={`border-b border-stone-100 last:border-b-0 odd:bg-white even:bg-primary-soft/50 ${isFetching ? "opacity-70" : ""}`}
                  >
                    <td className="whitespace-nowrap px-5 py-4 font-medium text-foreground">
                      {formatDate(item.agendaDate)}
                      <span className="mt-0.5 block text-xs font-normal text-muted">
                        {item.time}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-foreground">
                      {item.courseTitle}
                    </td>
                    <td className="max-w-xs truncate px-5 py-4 font-medium text-foreground">
                      {item.title?.trim() || "—"}
                    </td>
                    <td className="px-5 py-4 text-foreground">
                      {item.sectionsLabel || "—"}
                    </td>
                    <td className="max-w-xs truncate px-5 py-4 text-foreground">
                      {item.description}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-foreground">
                      {item.status === 1 ? "Active" : "Inactive"}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/agenda/${item.id}`}
                          className="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl border border-border bg-white text-foreground transition-colors hover:bg-primary-soft hover:text-primary"
                          aria-label={`View agenda ${item.id}`}
                          title="View"
                        >
                          <Eye aria-hidden className="h-4 w-4" />
                        </Link>
                        <Link
                          href={`/agenda/${item.id}/edit`}
                          className="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl border border-border bg-white text-foreground transition-colors hover:bg-primary-soft hover:text-primary"
                          aria-label={`Edit agenda ${item.id}`}
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
                          aria-label={`Remove agenda ${item.id}`}
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
          title="Remove agenda?"
          description="This agenda will be removed."
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
