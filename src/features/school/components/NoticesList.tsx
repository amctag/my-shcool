"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, CalendarDays, Plus, UserRound } from "lucide-react";
import { FilterSelect } from "@/components/dashboard/FilterSelect";
import { LoadingDots } from "@/components/dashboard/TableLoading";
import { TablePagination } from "@/components/dashboard/TablePagination";
import { TableSearchBar } from "@/components/dashboard/TableSearchBar";
import { YearFilterSelect } from "@/components/dashboard/YearFilterSelect";
import { getApiErrorMessage } from "@/lib/getApiErrorMessage";
import { useGetDashboardNoticesQuery } from "@/features/school/api/noticesApi";
import { useGetClassesQuery } from "@/features/school/api/classesApi";
import { useGetSectionsQuery } from "@/features/school/api/sectionsApi";
import { useSchoolYearFilter } from "@/features/school/useSchoolYearFilter";
import { selectAuthReady, selectAccessToken } from "@/features/auth/authSlice";
import { useAppSelector } from "@/store/hooks";
import type { DashboardNoticesQuery } from "@/features/school/types";

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
  appliedClassId: number,
  appliedSectionId: number,
): DashboardNoticesQuery {
  const query: DashboardNoticesQuery = {
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

export function NoticesList() {
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
  const { data, error, isLoading, isFetching } = useGetDashboardNoticesQuery(
    query,
    { skip: !canFetch || !appliedYearId },
  );

  const { data: classesData } = useGetClassesQuery(
    { page: 1, limit: 20, sortOrder: "asc" },
    { skip: !canFetch },
  );
  const classes = classesData?.items ?? [];
  const classSelected = draftClassId > 0;

  const { data: sectionsData, isFetching: sectionsLoading } = useGetSectionsQuery(
    {
      page: 1,
      limit: 20,
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
    return <LoadingDots label="Loading notices" />;
  }

  const items = data?.items ?? [];
  const pagination = data?.pagination;
  const totalPages = pagination?.totalPages ?? 0;

  return (
    <>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <TableSearchBar
          label="Search notices"
          placeholder="Search by description"
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
          href="/notices/add"
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
          {getApiErrorMessage(error, "Could not load notices")}
        </p>
      ) : items.length === 0 ? (
        <p className="rounded-2xl border border-border bg-white px-6 py-10 text-center text-sm text-muted">
          No notices match this search.
        </p>
      ) : (
        <>
          <div className="space-y-4">
            {items.map((item) => (
              <article
                key={item.id}
                className={`rounded-2xl border border-border bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] ${isFetching ? "opacity-70" : ""}`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                    <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
                      <Bell aria-hidden className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        {item.noticeTypeTitle ? (
                          <span className="rounded-full bg-primary-soft px-2.5 py-1 text-xs font-medium text-primary">
                            {item.noticeTypeTitle}
                          </span>
                        ) : null}
                        <span className="rounded-full border border-border px-2.5 py-1 text-xs font-medium text-muted">
                          {item.scope}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 text-sm text-muted">
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarDays aria-hidden className="h-4 w-4" />
                      {formatDate(item.date)}
                    </span>
                  </div>
                </div>

                <p className="mt-4 text-[15px] leading-relaxed text-foreground">
                  {item.description}
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
              </article>
            ))}
          </div>
          {pagination && totalPages > 0 ? (
            <TablePagination
              page={page}
              totalPages={totalPages}
              total={pagination.total}
              label="notices"
              disabled={isFetching}
              onPageChange={(next) => setPage(next)}
            />
          ) : null}
        </>
      )}
    </>
  );
}
