"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Eye, Pencil, Plus, Trash2 } from "lucide-react";
import { ConfirmDeleteDialog } from "@/components/dashboard/ConfirmDeleteDialog";
import { TableLoadingRow } from "@/components/dashboard/TableLoading";
import { TableSearchBar } from "@/components/dashboard/TableSearchBar";
import { getApiErrorMessage } from "@/lib/getApiErrorMessage";
import {
  useDeleteAttendanceReasonMutation,
  useGetAttendanceReasonsQuery,
} from "@/features/school/api/attendanceReasonsApi";
import { selectAuthReady, selectAccessToken } from "@/features/auth/authSlice";
import { useAppSelector } from "@/store/hooks";

export function AttendanceReasonsTable() {
  const ready = useAppSelector(selectAuthReady);
  const accessToken = useAppSelector(selectAccessToken);
  const canFetch = ready && Boolean(accessToken);
  const [searchInput, setSearchInput] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<{
    id: number;
    title: string;
  } | null>(null);

  const { data: reasons = [], error, isLoading, isFetching } =
    useGetAttendanceReasonsQuery(undefined, {
      skip: !canFetch,
    });
  const [deleteReason, deleteState] = useDeleteAttendanceReasonMutation();

  function applySearch() {
    setAppliedSearch(searchInput.trim());
  }

  const filtered = useMemo(() => {
    const query = appliedSearch.toLowerCase();
    if (!query) {
      return reasons;
    }
    return reasons.filter((item) => item.title.toLowerCase().includes(query));
  }, [appliedSearch, reasons]);

  async function confirmDelete() {
    if (!pendingDelete) {
      return;
    }
    setDeleteError(null);
    try {
      await deleteReason(pendingDelete.id).unwrap();
      setPendingDelete(null);
    } catch (caught) {
      setDeleteError(
        getApiErrorMessage(caught, "Could not delete attendance reason"),
      );
    }
  }

  return (
    <>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <TableSearchBar
          label="Search attendance reasons"
          placeholder="Search by title"
          value={searchInput}
          onChange={setSearchInput}
          onSearch={applySearch}
        />
        <Link
          href="/attendance/reasons/add"
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
                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-muted">
                  ID
                </th>
                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-muted">
                  Title
                </th>
                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-muted">
                  Status
                </th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-muted">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <TableLoadingRow
                  colSpan={4}
                  label="Loading attendance reasons"
                />
              ) : error ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-5 py-10 text-center text-sm text-red-600"
                    role="alert"
                  >
                    {getApiErrorMessage(
                      error,
                      "Could not load attendance reasons",
                    )}
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-5 py-10 text-center text-sm text-muted"
                  >
                    No attendance reasons found. Click Add to create one.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr
                    key={item.id}
                    className={`border-b border-stone-100 last:border-b-0 ${isFetching ? "opacity-70" : ""}`}
                  >
                    <td className="whitespace-nowrap px-5 py-4 font-semibold">
                      {item.id}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 font-semibold">
                      {item.title}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4">
                      {item.status ? "Active" : "Inactive"}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/attendance/reasons/${item.id}`}
                          aria-label="View"
                          title="View"
                          className="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl border border-border bg-white hover:bg-primary-soft hover:text-primary"
                        >
                          <Eye aria-hidden className="h-4 w-4" />
                        </Link>
                        <Link
                          href={`/attendance/reasons/${item.id}/edit`}
                          aria-label="Edit"
                          title="Edit"
                          className="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl border border-border bg-white hover:bg-primary-soft hover:text-primary"
                        >
                          <Pencil aria-hidden className="h-4 w-4" />
                        </Link>
                        <button
                          type="button"
                          aria-label="Delete"
                          title={
                            item.usageCount > 0
                              ? "Used by attendance records — cannot delete"
                              : "Delete"
                          }
                          disabled={item.usageCount > 0}
                          onClick={() => {
                            setDeleteError(null);
                            setPendingDelete({
                              id: item.id,
                              title: item.title,
                            });
                          }}
                          className="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl border border-border bg-white hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-40"
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
      </article>
      {pendingDelete ? (
        <ConfirmDeleteDialog
          title="Delete attendance reason"
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
    </>
  );
}
