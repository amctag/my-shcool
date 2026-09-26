"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, ClipboardList, Plus, Users } from "lucide-react";
import { LoadingDots } from "@/components/dashboard/TableLoading";
import { TablePagination } from "@/components/dashboard/TablePagination";
import { TableSearchBar } from "@/components/dashboard/TableSearchBar";
import { getApiErrorMessage } from "@/lib/getApiErrorMessage";
import { useGetDashboardTeacherTasksQuery } from "@/features/school/api/teacherTasksApi";
import { selectAuthReady, selectAccessToken } from "@/features/auth/authSlice";
import { useAppSelector } from "@/store/hooks";
import type { DashboardTeacherTasksQuery } from "@/features/school/types";

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
): DashboardTeacherTasksQuery {
  const query: DashboardTeacherTasksQuery = {
    page,
    limit: PAGE_SIZE,
  };
  if (appliedSearch) {
    query.search = appliedSearch;
  }
  return query;
}

export function TeacherTasksList() {
  const ready = useAppSelector(selectAuthReady);
  const accessToken = useAppSelector(selectAccessToken);
  const canFetch = ready && Boolean(accessToken);
  const [searchInput, setSearchInput] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [page, setPage] = useState(1);

  const query = buildQuery(page, appliedSearch);
  const { data, error, isLoading, isFetching } =
    useGetDashboardTeacherTasksQuery(query, { skip: !canFetch });

  function applySearch() {
    const next = searchInput.trim();
    if (next === appliedSearch) {
      return;
    }
    setPage(1);
    setAppliedSearch(next);
  }

  if (isLoading || !canFetch) {
    return <LoadingDots label="Loading tasks" />;
  }

  const items = data?.items ?? [];
  const pagination = data?.pagination;
  const totalPages = pagination?.totalPages ?? 0;

  return (
    <>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <TableSearchBar
          label="Search tasks"
          placeholder="Search by title or description"
          value={searchInput}
          onChange={setSearchInput}
          onSearch={applySearch}
          compact
        />
        <Link
          href="/teacher-tasks/add"
          className="inline-flex h-11 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-on-primary hover:bg-primary-hover"
        >
          <Plus aria-hidden className="h-4 w-4" />
          Add task
        </Link>
      </div>

      {error ? (
        <p
          className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700"
          role="alert"
        >
          {getApiErrorMessage(error, "Could not load tasks")}
        </p>
      ) : items.length === 0 ? (
        <p className="rounded-2xl border border-border bg-white px-6 py-10 text-center text-sm text-muted">
          No teacher tasks yet. Add one to notify all teachers.
        </p>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            {items.map((item) => (
              <article
                key={item.id}
                className={`overflow-hidden rounded-2xl border border-border bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] ${isFetching ? "opacity-70" : ""}`}
              >
                <div className="flex items-start gap-3">
                  <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
                    <ClipboardList aria-hidden className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-lg font-semibold text-foreground">
                      {item.title}
                    </h2>
                    <p className="mt-2 text-[15px] leading-relaxed text-foreground">
                      {item.description}
                    </p>
                    <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-stone-100 pt-4 text-sm text-muted">
                      <span className="inline-flex items-center gap-1.5">
                        <CheckCircle2 aria-hidden className="h-4 w-4" />
                        {item.completedCount} done
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Users aria-hidden className="h-4 w-4" />
                        {item.teacherCount} teachers
                      </span>
                      <span>Created {formatDateTime(item.createdAt)}</span>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
          {pagination && totalPages > 0 ? (
            <TablePagination
              page={page}
              totalPages={totalPages}
              total={pagination.total}
              label="tasks"
              disabled={isFetching}
              onPageChange={(next) => setPage(next)}
            />
          ) : null}
        </>
      )}
    </>
  );
}
