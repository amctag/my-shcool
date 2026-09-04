"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Eye,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { ConfirmDeleteDialog } from "@/components/dashboard/ConfirmDeleteDialog";
import { FilterSelect } from "@/components/dashboard/FilterSelect";
import { TableLoadingRow } from "@/components/dashboard/TableLoading";
import { TableSearchBar } from "@/components/dashboard/TableSearchBar";
import { YearFilterSelect } from "@/components/dashboard/YearFilterSelect";
import { getApiErrorMessage } from "@/lib/getApiErrorMessage";
import {
  useDeleteAttendanceMutation,
  useGetAttendancesQuery,
} from "@/features/school/api/attendancesApi";
import { useGetClassesQuery } from "@/features/school/api/classesApi";
import { useGetSectionsQuery } from "@/features/school/api/sectionsApi";
import { useSchoolYearFilter } from "@/features/school/useSchoolYearFilter";
import { selectAuthReady, selectAccessToken } from "@/features/auth/authSlice";
import { useAppSelector } from "@/store/hooks";
import type {
  AttendancesSortBy,
  AttendancesSortOrder,
  DashboardAttendancesQuery,
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
  appliedStatus: string,
  sortBy: AttendancesSortBy,
  sortOrder: AttendancesSortOrder,
): DashboardAttendancesQuery {
  const query: DashboardAttendancesQuery = {
    page,
    limit: PAGE_SIZE,
    sortBy,
    sortOrder,
  };
  if (appliedSearch) query.search = appliedSearch;
  if (appliedYearId) query.yearId = appliedYearId;
  if (appliedClassId) query.classId = appliedClassId;
  if (appliedSectionId) query.sectionId = appliedSectionId;
  if (appliedStatus === "1") query.status = true;
  if (appliedStatus === "0") query.status = false;
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
  column: AttendancesSortBy;
  sortBy: AttendancesSortBy;
  sortOrder: AttendancesSortOrder;
  onSort: (column: AttendancesSortBy) => void;
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

export function AttendancesTable() {
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
  const [draftStatus, setDraftStatus] = useState("");
  const [appliedClassId, setAppliedClassId] = useState(0);
  const [appliedSectionId, setAppliedSectionId] = useState(0);
  const [appliedStatus, setAppliedStatus] = useState("");
  const [draftYearId, setDraftYearId] = useState<number | null>(null);
  const [appliedYearId, setAppliedYearId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<AttendancesSortBy>("date");
  const [sortOrder, setSortOrder] = useState<AttendancesSortOrder>("desc");
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
    },
    { skip: !canFetch || !draftResolvedYearId || !draftClassId },
  );

  const query = buildQuery(
    page,
    appliedSearch,
    resolvedYearId,
    appliedClassId,
    appliedSectionId,
    appliedStatus,
    sortBy,
    sortOrder,
  );

  const { data, error, isFetching, isLoading } = useGetAttendancesQuery(query, {
    skip: !canFetch || !resolvedYearId,
  });
  const [deleteAttendance, deleteState] = useDeleteAttendanceMutation();

  const items = data?.items ?? [];
  const totalPages = data?.totalPages ?? 0;
  const total = data?.total ?? 0;
  const classes = classesData?.items ?? [];
  const sections = sectionsData?.items ?? [];

  function handleSort(column: AttendancesSortBy) {
    setPage(1);
    if (sortBy === column) {
      setSortOrder((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }
    setSortBy(column);
    setSortOrder(column === "date" || column === "id" ? "desc" : "asc");
  }

  function applySearch() {
    const next = searchInput.trim();
    if (
      next === appliedSearch &&
      draftYearId === appliedYearId &&
      draftClassId === appliedClassId &&
      draftSectionId === appliedSectionId &&
      draftStatus === appliedStatus
    ) {
      return;
    }
    setPage(1);
    setAppliedSearch(next);
    setAppliedYearId(draftYearId);
    setAppliedClassId(draftClassId);
    setAppliedSectionId(draftSectionId);
    setAppliedStatus(draftStatus);
  }

  async function confirmDelete() {
    if (deleteId == null) return;
    try {
      await deleteAttendance(deleteId).unwrap();
      setDeleteId(null);
      setDeleteError(null);
    } catch (err) {
      setDeleteError(getApiErrorMessage(err, "Could not delete attendance"));
    }
  }

  return (
    <div className="space-y-4">
      {savedMessage ? (
        <p
          className="rounded-2xl border border-green-200 bg-green-50 px-5 py-4 text-sm text-green-800"
          role="status"
        >
          Attendance saved successfully.
        </p>
      ) : null}

      {deleteError ? (
        <p
          className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700"
          role="alert"
        >
          {deleteError}
        </p>
      ) : null}

      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <TableSearchBar
          label="Search attendance"
          placeholder="Search class, section, or year"
          value={searchInput}
          onChange={setSearchInput}
          onSearch={applySearch}
          compact
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
          href="/attendance/add"
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
                  label="Date"
                  column="date"
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
                <TableLoadingRow colSpan={6} label="Loading attendance" />
              ) : error ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-10 text-center text-sm text-red-600"
                    role="alert"
                  >
                    {getApiErrorMessage(error, "Could not load attendance")}
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-10 text-center text-sm text-muted"
                  >
                    No attendance records found. Click Add to create one.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr
                    key={item.id}
                    className={`border-b border-stone-100 last:border-b-0 odd:bg-white even:bg-primary-soft/50 ${isFetching ? "opacity-70" : ""}`}
                  >
                    <td className="whitespace-nowrap px-5 py-4 font-medium text-foreground">
                      {formatDate(item.date)}
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
                      {item.status
                        ? `${item.absentCount} absent / ${item.studentCount}`
                        : "Inactive"}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/attendance/${item.id}`}
                          className="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl border border-border bg-white text-foreground transition-colors hover:bg-primary-soft hover:text-primary"
                          aria-label={`View attendance ${item.id}`}
                          title="View"
                        >
                          <Eye aria-hidden className="h-4 w-4" />
                        </Link>
                        <Link
                          href={`/attendance/${item.id}/edit`}
                          className="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl border border-border bg-white text-foreground transition-colors hover:bg-primary-soft hover:text-primary"
                          aria-label={`Edit attendance ${item.id}`}
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
                          aria-label={`Remove attendance ${item.id}`}
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
          <div className="flex items-center justify-between gap-3 border-t border-stone-100 px-5 py-4">
            <p className="text-sm text-muted">
              Page {page} of {totalPages} · {total} record
              {total === 1 ? "" : "s"}
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

      {deleteId != null ? (
        <ConfirmDeleteDialog
          title="Remove attendance?"
          description="This attendance record will be removed."
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
