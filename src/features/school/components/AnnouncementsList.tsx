"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarDays, ChevronLeft, ChevronRight, Megaphone, Plus, UserRound } from "lucide-react";
import { FilterSelect } from "@/components/dashboard/FilterSelect";
import { LoadingDots } from "@/components/dashboard/TableLoading";
import { TableSearchBar } from "@/components/dashboard/TableSearchBar";
import { YearFilterSelect } from "@/components/dashboard/YearFilterSelect";
import { getApiErrorMessage } from "@/lib/getApiErrorMessage";
import { useGetDashboardAnnouncementsQuery } from "@/features/school/api/announcementsApi";
import { useGetClassesQuery } from "@/features/school/api/classesApi";
import { useGetSectionsQuery } from "@/features/school/api/sectionsApi";
import { useSchoolYearFilter } from "@/features/school/useSchoolYearFilter";
import { selectAuthReady, selectAccessToken } from "@/features/auth/authSlice";
import { useAppSelector } from "@/store/hooks";
import type { DashboardAnnouncementsQuery } from "@/features/school/types";

const PAGE_SIZE = 10;

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function buildQuery(
  page: number,
  appliedSearch: string,
  appliedYearId: number | null,
  appliedClassId: number,
  appliedSectionId: number,
): DashboardAnnouncementsQuery {
  const query: DashboardAnnouncementsQuery = {
    page,
    limit: PAGE_SIZE,
  };
  if (appliedSearch) {
    query.search = appliedSearch;
  }
  if (appliedYearId) {
    query.yearId = appliedYearId;
  }
  if (appliedClassId) {
    query.classId = appliedClassId;
  }
  if (appliedSectionId) {
    query.sectionId = appliedSectionId;
  }
  return query;
}

export function AnnouncementsList() {
  const ready = useAppSelector(selectAuthReady);
  const accessToken = useAppSelector(selectAccessToken);
  const canFetch = ready && Boolean(accessToken);
  const [searchInput, setSearchInput] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [draftYearId, setDraftYearId] = useState<number | null>(null);
  const [appliedYearId, setAppliedYearId] = useState<number | null>(null);
  const [draftClassId, setDraftClassId] = useState(0);
  const [appliedClassId, setAppliedClassId] = useState(0);
  const [draftSectionId, setDraftSectionId] = useState(0);
  const [appliedSectionId, setAppliedSectionId] = useState(0);
  const [page, setPage] = useState(1);
  const { years, yearId: defaultYearId } = useSchoolYearFilter(canFetch);

  const query = buildQuery(
    page,
    appliedSearch,
    appliedYearId,
    appliedClassId,
    appliedSectionId,
  );
  const { data, error, isLoading, isFetching } = useGetDashboardAnnouncementsQuery(
    query,
    { skip: !canFetch || !appliedYearId },
  );

  const { data: classesData } = useGetClassesQuery(
    { page: 1, limit: 100, sortOrder: "asc" },
    { skip: !canFetch },
  );
  const classes = classesData?.items ?? [];
  const classSelected = draftClassId > 0;

  const { data: sectionsData, isFetching: sectionsLoading } = useGetSectionsQuery(
    {
      page: 1,
      limit: 100,
      yearId: draftYearId ?? undefined,
      classId: draftClassId,
      sortBy: "section",
      sortOrder: "asc",
    },
    { skip: !canFetch || !draftYearId || !classSelected },
  );
  const sections = sectionsData?.items ?? [];

  useEffect(() => {
    if (!defaultYearId) {
      return;
    }
    setDraftYearId((current) => current ?? defaultYearId);
    setAppliedYearId((current) => current ?? defaultYearId);
  }, [defaultYearId]);

  function applySearch() {
    const next = searchInput.trim();
    if (
      next === appliedSearch &&
      draftYearId === appliedYearId &&
      draftClassId === appliedClassId &&
      draftSectionId === appliedSectionId
    ) {
      return;
    }
    setPage(1);
    setAppliedSearch(next);
    setAppliedYearId(draftYearId);
    setAppliedClassId(draftClassId);
    setAppliedSectionId(draftSectionId);
  }

  if (isLoading || !canFetch || !appliedYearId) {
    return <LoadingDots label="Loading announcements" />;
  }

  const items = data?.items ?? [];
  const pagination = data?.pagination;
  const totalPages = pagination?.totalPages ?? 0;

  return (
    <>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <TableSearchBar
          label="Search announcements"
          placeholder="Search by title"
          value={searchInput}
          onChange={setSearchInput}
          onSearch={applySearch}
          compact
        >
          <YearFilterSelect
            years={years}
            value={draftYearId}
            onChange={(yearId) => {
              setDraftYearId(yearId);
              setDraftClassId(0);
              setDraftSectionId(0);
            }}
          />
          <FilterSelect
            label="Filter by class"
            value={draftClassId}
            options={[
              { value: 0, label: "All classes" },
              ...classes.map((itemClass) => ({
                value: itemClass.id,
                label: itemClass.className,
              })),
            ]}
            onChange={(classId) => {
              setDraftClassId(classId);
              setDraftSectionId(0);
            }}
          />
          <FilterSelect
            label="Filter by section"
            value={draftSectionId}
            disabled={!classSelected}
            options={
              !classSelected
                ? [{ value: 0, label: "Select a class first" }]
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
        <Link
          href="/announcements/add"
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
          {getApiErrorMessage(error, "Could not load announcements")}
        </p>
      ) : items.length === 0 ? (
        <p className="rounded-2xl border border-border bg-white px-6 py-10 text-center text-sm text-muted">
          No announcements match this search.
        </p>
      ) : (
        <>
          <div className="space-y-4">
            {items.map((item) => {
            const title = item.title?.trim() || "Untitled announcement";

            return (
              <article
                key={item.id}
                className={`rounded-2xl border border-border bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] ${isFetching ? "opacity-70" : ""}`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                    <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
                      <Megaphone aria-hidden className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-lg font-semibold text-foreground">
                          {title}
                        </h2>
                        <span className="rounded-full bg-primary-soft px-2.5 py-1 text-xs font-medium text-primary">
                          {item.audienceLabel}
                        </span>
                        <span className="rounded-full border border-border px-2.5 py-1 text-xs font-medium text-muted">
                          {item.scope}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 text-sm text-muted">
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarDays aria-hidden className="h-4 w-4" />
                      Published {formatDateTime(item.publishedAt)}
                    </span>
                  </div>
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
                  <span>Person ID {item.personId}</span>
                  <span>Created {formatDateTime(item.createdAt)}</span>
                </div>
              </article>
            );
          })}
          </div>
          {pagination && totalPages > 0 ? (
            <div className="mt-5 flex items-center justify-between gap-3 rounded-2xl border border-border bg-white px-5 py-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              <p className="text-sm text-muted">
                Page {pagination.page} of {totalPages} · {pagination.total}{" "}
                announcement{pagination.total === 1 ? "" : "s"}
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
