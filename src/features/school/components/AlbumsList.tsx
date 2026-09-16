"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  CalendarDays,
  Images,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { ConfirmDeleteDialog } from "@/components/dashboard/ConfirmDeleteDialog";
import { LoadingDots } from "@/components/dashboard/TableLoading";
import { TablePagination } from "@/components/dashboard/TablePagination";
import { TableSearchBar } from "@/components/dashboard/TableSearchBar";
import { YearFilterSelect } from "@/components/dashboard/YearFilterSelect";
import { getApiErrorMessage } from "@/lib/getApiErrorMessage";
import {
  useDeleteDashboardAlbumMutation,
  useGetDashboardAlbumsQuery,
} from "@/features/school/api/albumsApi";
import { useSchoolYearFilter } from "@/features/school/useSchoolYearFilter";
import { selectAuthReady, selectAccessToken } from "@/features/auth/authSlice";
import { useAppSelector } from "@/store/hooks";
import type { DashboardAlbumsQuery } from "@/features/school/types";

const PAGE_SIZE = 10;

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
  }).format(new Date(`${value}T00:00:00`));
}

function buildQuery(
  page: number,
  appliedSearch: string,
  appliedYearId: number | null,
): DashboardAlbumsQuery {
  const query: DashboardAlbumsQuery = {
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

export function AlbumsList() {
  const ready = useAppSelector(selectAuthReady);
  const accessToken = useAppSelector(selectAccessToken);
  const canFetch = ready && Boolean(accessToken);
  const [searchInput, setSearchInput] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [draftYearId, setDraftYearId] = useState<number | null>(null);
  const [appliedYearId, setAppliedYearId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const { years, yearId: defaultYearId } = useSchoolYearFilter(canFetch);
  const [deleteAlbum, deleteState] = useDeleteDashboardAlbumMutation();

  const query = buildQuery(page, appliedSearch, appliedYearId);
  const { data, error, isLoading, isFetching } = useGetDashboardAlbumsQuery(
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

  async function confirmDelete() {
    if (deleteId == null) {
      return;
    }
    setDeleteError(null);
    try {
      await deleteAlbum(deleteId).unwrap();
      setDeleteId(null);
    } catch (caught) {
      setDeleteError(getApiErrorMessage(caught, "Could not remove album"));
    }
  }

  if (isLoading || !canFetch || !appliedYearId) {
    return <LoadingDots label="Loading albums" />;
  }

  const items = data?.items ?? [];
  const pagination = data?.pagination;
  const totalPages = pagination?.totalPages ?? 0;

  return (
    <>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <TableSearchBar
          label="Search albums"
          placeholder="Search by title or description"
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
          href="/albums/add"
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
          {getApiErrorMessage(error, "Could not load albums")}
        </p>
      ) : items.length === 0 ? (
        <p className="rounded-2xl border border-border bg-white px-6 py-10 text-center text-sm text-muted">
          No albums match this search. Click Add to create one.
        </p>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            {items.map((item) => (
              <article
                key={item.id}
                className={`overflow-hidden rounded-2xl border border-border bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] ${isFetching ? "opacity-70" : ""}`}
              >
                {item.coverImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.coverImage}
                    alt=""
                    className="h-40 w-full object-cover"
                  />
                ) : (
                  <div className="flex h-40 items-center justify-center bg-primary-soft text-sm font-medium text-primary">
                    {item.photoCount} {item.photoCount === 1 ? "photo" : "photos"}
                  </div>
                )}
                <div className="p-6">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
                        <Images aria-hidden className="h-5 w-5" />
                      </span>
                      <div className="min-w-0">
                        <h2 className="text-lg font-semibold text-foreground">
                          {item.title}
                        </h2>
                        <span className="rounded-full border border-border px-2.5 py-1 text-xs font-medium text-muted">
                          {item.yearTitle} · {item.photoCount}{" "}
                          {item.photoCount === 1 ? "photo" : "photos"}
                        </span>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1.5 text-sm text-muted">
                      <CalendarDays aria-hidden className="h-4 w-4" />
                      {formatDate(item.date)}
                    </span>
                  </div>
                  <p className="mt-4 line-clamp-3 text-[15px] leading-relaxed text-foreground">
                    {item.description}
                  </p>
                  <div className="mt-5 flex items-center justify-end gap-2 border-t border-stone-100 pt-4">
                    <Link
                      href={`/albums/${item.id}/edit`}
                      className="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl border border-border bg-white text-foreground transition-colors hover:bg-primary-soft hover:text-primary"
                      aria-label={`Edit album ${item.title}`}
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
                      aria-label={`Remove album ${item.title}`}
                      title="Remove"
                    >
                      <Trash2 aria-hidden className="h-4 w-4" />
                    </button>
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
              label="albums"
              disabled={isFetching}
              onPageChange={(next) => setPage(next)}
            />
          ) : null}
        </>
      )}

      {deleteId != null ? (
        <ConfirmDeleteDialog
          title="Remove album?"
          description="This album will be removed from the school apps."
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
    </>
  );
}
