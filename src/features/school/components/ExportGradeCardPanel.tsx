"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { FilterSelect } from "@/components/dashboard/FilterSelect";
import { TableLoadingRow } from "@/components/dashboard/TableLoading";
import { YearFilterSelect } from "@/components/dashboard/YearFilterSelect";
import { getApiErrorMessage } from "@/lib/getApiErrorMessage";
import { selectAuthReady, selectAccessToken } from "@/features/auth/authSlice";
import { useGetClassesQuery } from "@/features/school/api/classesApi";
import { useGetRegistrationsQuery } from "@/features/school/api/registrationsApi";
import { useGetSectionsQuery } from "@/features/school/api/sectionsApi";
import { useSchoolYearFilter } from "@/features/school/useSchoolYearFilter";
import { useAppSelector } from "@/store/hooks";

const PAGE_SIZE = 50;

function buildOpenGradeHref(item: {
  id: number;
  yearId: number;
  classId: number;
  sectionId: number;
}) {
  const params = new URLSearchParams({
    registrationId: String(item.id),
    yearId: String(item.yearId),
    classId: String(item.classId),
    sectionId: String(item.sectionId),
  });
  return `/export-grade-card/open?${params.toString()}`;
}

export function ExportGradeCardPanel() {
  const ready = useAppSelector(selectAuthReady);
  const accessToken = useAppSelector(selectAccessToken);
  const canFetch = ready && Boolean(accessToken);
  const { years, yearId: defaultYearId } = useSchoolYearFilter(canFetch);

  const [draftYearId, setDraftYearId] = useState<number | null>(null);
  const [draftClassId, setDraftClassId] = useState(0);
  const [draftSectionId, setDraftSectionId] = useState(0);
  const [appliedYearId, setAppliedYearId] = useState<number | null>(null);
  const [appliedClassId, setAppliedClassId] = useState(0);
  const [appliedSectionId, setAppliedSectionId] = useState(0);
  const [page, setPage] = useState(1);
  const [filtersApplied, setFiltersApplied] = useState(false);

  const resolvedDraftYearId = draftYearId ?? defaultYearId;
  const resolvedAppliedYearId = appliedYearId ?? defaultYearId;
  const canLoadStudents =
    filtersApplied &&
    Boolean(resolvedAppliedYearId) &&
    appliedClassId > 0 &&
    appliedSectionId > 0;

  const { data: classesData } = useGetClassesQuery(
    { page: 1, limit: 100, sortOrder: "asc" },
    { skip: !canFetch },
  );
  const classes = classesData?.items ?? [];

  const { data: sectionsData, isSuccess: sectionsReady } = useGetSectionsQuery(
    {
      page: 1,
      limit: 100,
      classId: draftClassId > 0 ? draftClassId : undefined,
      yearId: resolvedDraftYearId ?? undefined,
      sortBy: "section",
      sortOrder: "asc",
    },
    { skip: !canFetch || !resolvedDraftYearId || draftClassId <= 0 },
  );
  const sections = sectionsData?.items ?? [];

  const { data, error, isLoading, isFetching } = useGetRegistrationsQuery(
    {
      page,
      limit: PAGE_SIZE,
      yearId: resolvedAppliedYearId ?? undefined,
      classId: appliedClassId,
      sectionId: appliedSectionId,
      sortBy: "student",
      sortOrder: "asc",
    },
    { skip: !canFetch || !canLoadStudents },
  );

  const items = data?.items ?? [];
  const pagination = data?.pagination;
  const totalPages = pagination?.totalPages ?? 0;

  useEffect(() => {
    if (!draftClassId || !sectionsReady) {
      return;
    }
    const stillValid = sections.some((section) => section.id === draftSectionId);
    if (!stillValid) {
      setDraftSectionId(0);
    }
  }, [draftClassId, draftSectionId, sections, sectionsReady]);

  useEffect(() => {
    setDraftSectionId(0);
  }, [draftClassId, draftYearId]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const params = new URLSearchParams(window.location.search);
    const yearId = Number(params.get("yearId"));
    const classId = Number(params.get("classId"));
    const sectionId = Number(params.get("sectionId"));
    if (!yearId || !classId || !sectionId) {
      return;
    }
    setDraftYearId(yearId);
    setDraftClassId(classId);
    setDraftSectionId(sectionId);
    setAppliedYearId(yearId);
    setAppliedClassId(classId);
    setAppliedSectionId(sectionId);
    setFiltersApplied(true);
  }, []);

  function applyFilters() {
    if (!resolvedDraftYearId || draftClassId <= 0 || draftSectionId <= 0) {
      return;
    }
    setPage(1);
    setAppliedYearId(resolvedDraftYearId);
    setAppliedClassId(draftClassId);
    setAppliedSectionId(draftSectionId);
    setFiltersApplied(true);
  }

  const selectedSection = sections.find(
    (section) => section.id === draftSectionId,
  );

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border bg-white p-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <YearFilterSelect
              years={years}
              value={resolvedDraftYearId}
              onChange={setDraftYearId}
            />
            <FilterSelect
              label="Class"
              value={draftClassId}
              options={[
                { value: 0, label: "Class" },
                ...classes.map((item) => ({
                  value: item.id,
                  label: item.className,
                })),
              ]}
              onChange={setDraftClassId}
            />
            <FilterSelect
              label="Section"
              value={draftSectionId}
              options={[
                { value: 0, label: "Section" },
                ...sections.map((item) => ({
                  value: item.id,
                  label: item.sectionTitle,
                })),
              ]}
              onChange={setDraftSectionId}
              disabled={draftClassId <= 0 || !resolvedDraftYearId}
            />
          </div>
          <button
            type="button"
            onClick={applyFilters}
            disabled={
              !resolvedDraftYearId || draftClassId <= 0 || draftSectionId <= 0
            }
            className="inline-flex h-11 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-on-primary hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Search aria-hidden className="h-4 w-4" />
            Search
          </button>
        </div>
        {selectedSection ? (
          <p className="mt-3 text-sm text-muted">
            {selectedSection.className} · {selectedSection.sectionTitle} ·{" "}
            {selectedSection.yearTitle}
          </p>
        ) : null}
      </div>

      <article className="overflow-hidden rounded-2xl bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-stone-100 bg-stone-50/80">
              <tr>
                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-muted">
                  #
                </th>
                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-muted">
                  Student
                </th>
                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-muted">
                  Class
                </th>
                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-muted">
                  Section
                </th>
                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-muted">
                  Year
                </th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-muted">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {!filtersApplied ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-10 text-center text-sm text-muted"
                  >
                    Select year, class, and section, then click Search.
                  </td>
                </tr>
              ) : isLoading ? (
                <TableLoadingRow colSpan={6} label="Loading students" />
              ) : error ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-10 text-center text-sm text-red-600"
                    role="alert"
                  >
                    {getApiErrorMessage(error, "Could not load students")}
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-10 text-center text-sm text-muted"
                  >
                    No students found for this section.
                  </td>
                </tr>
              ) : (
                items.map((item, index) => (
                  <tr
                    key={item.id}
                    className={`border-b border-stone-100 last:border-b-0 odd:bg-white even:bg-primary-soft/50 ${isFetching ? "opacity-70" : ""}`}
                  >
                    <td className="whitespace-nowrap px-5 py-4 font-semibold text-foreground">
                      {(page - 1) * PAGE_SIZE + index + 1}
                    </td>
                    <td className="px-5 py-4 font-medium text-foreground">
                      {item.studentName}
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
                    <td className="px-5 py-4">
                      <div className="flex justify-end">
                        <Link
                          href={buildOpenGradeHref(item)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex h-10 cursor-pointer items-center rounded-lg bg-primary px-4 text-sm font-medium text-on-primary hover:bg-primary-hover"
                        >
                          Open grade
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {canLoadStudents && pagination && totalPages > 0 ? (
          <div className="flex items-center justify-between gap-3 border-t border-stone-100 px-5 py-4">
            <p className="text-sm text-muted">
              Page {pagination.page} of {totalPages} · {pagination.total}{" "}
              student{pagination.total === 1 ? "" : "s"}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={page <= 1 || isFetching}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                className="inline-flex h-11 cursor-pointer items-center rounded-xl border border-border px-3 text-sm font-medium hover:bg-primary-soft disabled:cursor-not-allowed disabled:opacity-50"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={page >= totalPages || isFetching}
                onClick={() =>
                  setPage((current) => Math.min(totalPages, current + 1))
                }
                className="inline-flex h-11 cursor-pointer items-center rounded-xl border border-border px-3 text-sm font-medium hover:bg-primary-soft disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        ) : null}
      </article>
    </div>
  );
}
