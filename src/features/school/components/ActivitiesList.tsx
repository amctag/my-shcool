"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarDays, ChevronLeft, ChevronRight, Plus, Sparkles, UserRound } from "lucide-react";
import { LoadingDots } from "@/components/dashboard/TableLoading";
import { TableSearchBar } from "@/components/dashboard/TableSearchBar";
import { YearFilterSelect } from "@/components/dashboard/YearFilterSelect";
import { getApiErrorMessage } from "@/lib/getApiErrorMessage";
import { useGetDashboardActivitiesQuery } from "@/features/school/api/activitiesApi";
import { useSchoolYearFilter } from "@/features/school/useSchoolYearFilter";
import { selectAuthReady, selectAccessToken } from "@/features/auth/authSlice";
import { useAppSelector } from "@/store/hooks";
import type { DashboardActivitiesQuery } from "@/features/school/types";

const PAGE_SIZE = 10;

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
  }).format(new Date(`${value}T00:00:00`));
}

function buildQuery(
  page: number,
  appliedSearch: string,
  appliedYearId: number | null,
): DashboardActivitiesQuery {
  const query: DashboardActivitiesQuery = {
    page,
    limit: PAGE_SIZE,
  };
  if (appliedSearch) {
    query.search = appliedSearch;
  }
  if (appliedYearId) {
    query.yearId = appliedYearId;
  }
  return query;
}

export function ActivitiesList() {
  const ready = useAppSelector(selectAuthReady);
  const accessToken = useAppSelector(selectAccessToken);
  const canFetch = ready && Boolean(accessToken);
  const [searchInput, setSearchInput] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [draftYearId, setDraftYearId] = useState<number | null>(null);
  const [appliedYearId, setAppliedYearId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const { years, yearId: defaultYearId } = useSchoolYearFilter(canFetch);

  const query = buildQuery(page, appliedSearch, appliedYearId);
  const { data, error, isLoading, isFetching } = useGetDashboardActivitiesQuery(
    query,
    { skip: !canFetch || !appliedYearId },
  );

  useEffect(() => {
    if (!defaultYearId) {
      return;
    }
    setDraftYearId((current) => current ?? defaultYearId);
    setAppliedYearId((current) => current ?? defaultYearId);
  }, [defaultYearId]);

  function applySearch() {
    const next = searchInput.trim();
    if (next === appliedSearch && draftYearId === appliedYearId) {
      return;
    }
    setPage(1);
    setAppliedSearch(next);
    setAppliedYearId(draftYearId);
  }

  if (isLoading || !canFetch || !appliedYearId) {
    return <LoadingDots label="Loading activities" />;
  }

  const items = data?.items ?? [];
  const pagination = data?.pagination;
  const totalPages = pagination?.totalPages ?? 0;

  return (
    <>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <TableSearchBar
          label="Search activities"
          placeholder="Search by title or content"
          value={searchInput}
          onChange={setSearchInput}
          onSearch={applySearch}
          compact
        >
          <YearFilterSelect
            years={years}
            value={draftYearId}
            onChange={setDraftYearId}
          />
        </TableSearchBar>
        <Link
          href="/activities/add"
          className="inline-flex h-11 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-on-primary hover:bg-primary-hover"
        >
          <Plus aria-hidden className="h-4 w-4" />
          Add
        </Link>
      </div>

      {error ? (
        <p
          className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700"
          role="alert"
        >
          {getApiErrorMessage(error, "Could not load activities")}
        </p>
      ) : items.length === 0 ? (
        <p className="rounded-2xl border border-border bg-white px-6 py-10 text-center text-sm text-muted">
          No activities match this search.
        </p>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            {items.map((item) => (
              <article
                key={item.id}
                className={`overflow-hidden rounded-2xl border border-border bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] ${isFetching ? "opacity-70" : ""}`}
              >
                {item.image ? (
                  <img
                    src={item.image}
                    alt=""
                    className="h-40 w-full object-cover"
                  />
                ) : null}
                <div className="p-6">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
                        <Sparkles aria-hidden className="h-5 w-5" />
                      </span>
                      <div className="min-w-0">
                        <h2 className="text-lg font-semibold text-foreground">
                          {item.title}
                        </h2>
                        <span className="rounded-full border border-border px-2.5 py-1 text-xs font-medium text-muted">
                          {item.scope}
                        </span>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1.5 text-sm text-muted">
                      <CalendarDays aria-hidden className="h-4 w-4" />
                      {formatDate(item.date)}
                    </span>
                  </div>
                  <p className="mt-4 text-[15px] leading-relaxed text-foreground">
                    {item.content}
                  </p>
                  <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-stone-100 pt-4 text-sm text-muted">
                    <span className="inline-flex items-center gap-1.5">
                      <UserRound aria-hidden className="h-4 w-4" />
                      Created by{" "}
                      <span className="font-medium text-foreground">
                        {item.createdByName}
                      </span>
                    </span>
                    <span>Created {formatDateTime(item.createdAt)}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
          {pagination && totalPages > 0 ? (
            <div className="mt-5 flex items-center justify-between gap-3 rounded-2xl border border-border bg-white px-5 py-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              <p className="text-sm text-muted">
                Page {pagination.page} of {totalPages} · {pagination.total}{" "}
                {pagination.total === 1 ? "activity" : "activities"}
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
        </>
      )}
    </>
  );
}
