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
  yearId: number | null,
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
  if (yearId) query.yearId = yearId;
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
  const { yearId } = useSchoolYearFilter(canFetch);

  const savedMessage = searchParams.get("saved") === "1";

  const [searchInput, setSearchInput] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [draftClassId, setDraftClassId] = useState(0);
  const [draftSectionId, setDraftSectionId] = useState(0);
  const [draftStatus, setDraftStatus] = useState("");
  const [appliedClassId, setAppliedClassId] = useState(0);
  const [appliedSectionId, setAppliedSectionId] = useState(0);
  const [appliedStatus, setAppliedStatus] = useState("");
  const [page, setPage] = useState(1);
  useEffect(() => {
    setPage(1);
  }, [yearId]);

  const [sortBy, setSortBy] = useState<AttendancesSortBy>("date");
  const [sortOrder, setSortOrder] = useState<AttendancesSortOrder>("desc");
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const { data: classesData } = useGetClassesQuery(
    { page: 1, limit: 20, sortOrder: "asc" },
    { skip: !canFetch },
  );
  const { data: sectionsData } = useGetSectionsQuery(
    {
      page: 1,
      limit: 20,
      yearId: yearId ?? undefined,
      classId: draftClassId || undefined,
    },
    { skip: !canFetch || !yearId || !draftClassId },
  );

  const query = buildQuery(
    page,
    appliedSearch,
    yearId,
    appliedClassId,
    appliedSectionId,
    appliedStatus,
    sortBy,
    sortOrder,
  );

  const { data, error, isFetching, isLoading } = useGetAttendancesQuery(query, {
    skip: !canFetch || !yearId,
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
      draftClassId === appliedClassId &&
      draftSectionId === appliedSectionId &&
      draftStatus === appliedStatus
    ) {
      return;
    }
    setPage(1);
    setAppliedSearch(next);
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
                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-muted">
                  Course
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
                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-muted">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading || !yearId ? (
                <TableLoadingRow colSpan={7} label="Loading attendance" />
              ) : error ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-10 text-center text-sm text-red-600"
                    role="alert"
                  >
                    {getApiErrorMessage(error, "Could not load attendance")}
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
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
                      {item.courseTitle ?? "Class"}
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
