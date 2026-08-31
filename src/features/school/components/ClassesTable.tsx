"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
} from "lucide-react";
import { FilterSelect } from "@/components/dashboard/FilterSelect";
import { TableLoadingRow } from "@/components/dashboard/TableLoading";
import { TableSearchBar } from "@/components/dashboard/TableSearchBar";
import {
  useGetClassesQuery,
  useGetStagesQuery,
} from "@/features/school/api/classesApi";
import { selectAuthReady, selectAccessToken } from "@/features/auth/authSlice";
import { getApiErrorMessage } from "@/lib/getApiErrorMessage";
import { useAppSelector } from "@/store/hooks";
import type {
  ClassesSortOrder,
  DashboardClassesQuery,
} from "@/features/school/types";

const PAGE_SIZE = 10;

function buildQuery(
  page: number,
  limit: number,
  appliedSearch: string,
  sortOrder: ClassesSortOrder,
  stageId: number,
): DashboardClassesQuery {
  const query: DashboardClassesQuery = { page, limit, sortOrder };
  if (appliedSearch) {
    query.search = appliedSearch;
  }
  if (stageId) {
    query.stageId = stageId;
  }
  return query;
}

export function ClassesTable() {
  const ready = useAppSelector(selectAuthReady);
  const accessToken = useAppSelector(selectAccessToken);
  const canFetch = ready && Boolean(accessToken);
  const [searchInput, setSearchInput] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [draftStageId, setDraftStageId] = useState(0);
  const [appliedStageId, setAppliedStageId] = useState(0);
  const [sortOrder, setSortOrder] = useState<ClassesSortOrder>("asc");
  const [page, setPage] = useState(1);
  const limit = PAGE_SIZE;
  const query = buildQuery(page, limit, appliedSearch, sortOrder, appliedStageId);
  const { data, error, isLoading, isFetching } = useGetClassesQuery(query, {
    skip: !canFetch,
  });
  const { data: stages = [] } = useGetStagesQuery(undefined, {
    skip: !canFetch,
  });

  function applySearch() {
    const next = searchInput.trim();
    if (next === appliedSearch && draftStageId === appliedStageId) {
      return;
    }
    setPage(1);
    setAppliedSearch(next);
    setAppliedStageId(draftStageId);
  }

  const classes = data?.items ?? [];
  const pagination = data?.pagination;
  const totalPages = pagination?.totalPages ?? 0;

  return (
    <>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <TableSearchBar
          label="Search classes"
          placeholder="Search by class name"
          value={searchInput}
          onChange={setSearchInput}
          onSearch={applySearch}
        >
          <FilterSelect
            label="Filter by stage"
            value={draftStageId}
            options={[
              { value: 0, label: "All stages" },
              ...stages.map((stage) => ({
                value: stage.id,
                label: stage.title,
              })),
            ]}
            onChange={setDraftStageId}
          />
        </TableSearchBar>
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
                  Class
                </th>
                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-muted">
                  Stage
                </th>
                <th className="px-5 py-3.5">
                  <button
                    type="button"
                    onClick={() => {
                      setPage(1);
                      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                    }}
                    className="inline-flex min-h-11 cursor-pointer items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted hover:text-foreground"
                  >
                    Level
                    <span className="inline-flex flex-col -space-y-1" aria-hidden>
                      <ChevronUp
                        className={`h-3 w-3 ${sortOrder === "asc" ? "text-primary" : "text-muted/40"}`}
                      />
                      <ChevronDown
                        className={`h-3 w-3 ${sortOrder === "desc" ? "text-primary" : "text-muted/40"}`}
                      />
                    </span>
                  </button>
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <TableLoadingRow colSpan={4} label="Loading classes" />
              ) : error ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-5 py-10 text-center text-sm text-red-600"
                    role="alert"
                  >
                    {getApiErrorMessage(error, "Could not load classes")}
                  </td>
                </tr>
              ) : classes.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-5 py-10 text-center text-sm text-muted"
                  >
                    {appliedSearch
                      ? "No classes match that name."
                      : "No classes are set up for this school."}
                  </td>
                </tr>
              ) : (
                classes.map((item) => (
                  <tr
                    key={item.id}
                    className={`border-b border-stone-100 last:border-b-0 ${isFetching ? "opacity-70" : ""}`}
                  >
                    <td className="whitespace-nowrap px-5 py-4 font-semibold text-foreground">
                      {item.id}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 font-semibold text-foreground">
                      {item.className}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-foreground">
                      {item.stageTitle}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-foreground">
                      {item.classLevel}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {pagination && totalPages > 0 ? (
          <div className="flex flex-col gap-3 border-t border-stone-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted">
              Page {pagination.page} of {totalPages} · {pagination.total} classes
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={page <= 1 || isFetching}
                onClick={() => setPage(page - 1)}
                className="inline-flex h-11 cursor-pointer items-center gap-1 rounded-xl border border-border px-3 text-sm font-medium hover:bg-primary-soft disabled:opacity-50"
              >
                <ChevronLeft aria-hidden className="h-4 w-4" />
                Previous
              </button>
              <button
                type="button"
                disabled={page >= totalPages || isFetching}
                onClick={() => setPage(page + 1)}
                className="inline-flex h-11 cursor-pointer items-center gap-1 rounded-xl border border-border px-3 text-sm font-medium hover:bg-primary-soft disabled:opacity-50"
              >
                Next
                <ChevronRight aria-hidden className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : null}
      </article>
    </>
  );
}
