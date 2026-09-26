"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Pencil, PiggyBank, Plus, Search } from "lucide-react";
import { LoadingDots } from "@/components/dashboard/TableLoading";
import { TablePagination } from "@/components/dashboard/TablePagination";
import { getApiErrorMessage } from "@/lib/getApiErrorMessage";
import { useGetDashboardAccountsPageQuery } from "@/features/school/api/accountingApi";
import { selectAuthReady, selectAccessToken } from "@/features/auth/authSlice";
import { useAppSelector } from "@/store/hooks";
import type { DashboardAccountType } from "@/features/school/types";

const PAGE_SIZE = 10;

const TYPE_FILTERS: Array<"ALL" | DashboardAccountType> = [
  "ALL",
  "PERSON",
  "CASH",
  "SALES",
  "PURCHASES",
  "GENERAL",
];

const TYPE_BADGE: Record<DashboardAccountType, string> = {
  PERSON: "bg-sky-100 text-sky-800",
  CASH: "bg-green-100 text-green-800",
  SALES: "bg-amber-100 text-amber-800",
  PURCHASES: "bg-purple-100 text-purple-800",
  GENERAL: "bg-stone-200 text-stone-700",
};

const selectClass =
  "h-11 rounded-xl border border-border bg-white px-3 text-sm text-foreground outline-none transition-colors duration-200 focus:border-primary";

export function AccountsList() {
  const ready = useAppSelector(selectAuthReady);
  const accessToken = useAppSelector(selectAccessToken);
  const canFetch = ready && Boolean(accessToken);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [type, setType] = useState<"ALL" | DashboardAccountType>("ALL");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const { data, error, isLoading, isFetching } =
    useGetDashboardAccountsPageQuery(
      {
        page,
        limit: PAGE_SIZE,
        search: search || undefined,
        type,
      },
      { skip: !canFetch },
    );

  if (isLoading || !canFetch) {
    return <LoadingDots label="Loading accounts" />;
  }

  const items = data?.items ?? [];
  const totalPages = data?.totalPages ?? 0;
  const total = data?.total ?? 0;

  return (
    <>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <p className="text-sm text-muted">
          Chart of accounts for this school. Person accounts are created from
          the Parents page; banks and cash boxes can be added here.
        </p>
        <Link
          href="/accounting/accounts/add"
          className="inline-flex h-11 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-on-primary hover:bg-primary-hover"
        >
          <Plus aria-hidden className="h-4 w-4" />
          New account
        </Link>
      </div>

      <div className="mb-5 flex flex-col gap-3 sm:flex-row">
        <label className="relative flex-1">
          <Search
            aria-hidden
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
          />
          <input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search by code or name"
            className="h-11 w-full rounded-xl border border-border bg-white pl-9 pr-3 text-sm text-foreground outline-none transition-colors duration-200 placeholder:text-muted/80 focus:border-primary"
          />
        </label>
        <select
          aria-label="Filter by account type"
          value={type}
          onChange={(event) => {
            setType(event.target.value as "ALL" | DashboardAccountType);
            setPage(1);
          }}
          className={selectClass}
        >
          {TYPE_FILTERS.map((option) => (
            <option key={option} value={option}>
              {option === "ALL" ? "All types" : option}
            </option>
          ))}
        </select>
      </div>

      {error ? (
        <p
          className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700"
          role="alert"
        >
          {getApiErrorMessage(error, "Could not load accounts")}
        </p>
      ) : items.length === 0 ? (
        <p className="rounded-2xl border border-border bg-white px-6 py-10 text-center text-sm text-muted">
          No accounts match. Adjust the search or create a new account.
        </p>
      ) : (
        <>
          <div
            className={`overflow-hidden rounded-2xl border border-border bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] ${isFetching ? "opacity-70" : ""}`}
          >
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-xs uppercase tracking-wide text-muted">
                    <th className="px-5 py-3 font-medium">Code</th>
                    <th className="px-5 py-3 font-medium">Account name</th>
                    <th className="px-5 py-3 font-medium">Type</th>
                    <th className="px-5 py-3 font-medium">Related person</th>
                    <th className="px-5 py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b border-stone-100 last:border-0"
                    >
                      <td className="whitespace-nowrap px-5 py-3 font-medium text-foreground">
                        {item.code}
                      </td>
                      <td className="px-5 py-3 text-foreground">{item.name}</td>
                      <td className="whitespace-nowrap px-5 py-3">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${TYPE_BADGE[item.type]}`}
                        >
                          <PiggyBank aria-hidden className="h-3 w-3" />
                          {item.type}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-muted">
                        {item.relatedPerson?.fullName || "—"}
                      </td>
                      <td className="whitespace-nowrap px-5 py-3 text-right">
                        {item.protected ? (
                          <span className="text-xs text-muted">System</span>
                        ) : (
                          <Link
                            href={`/accounting/accounts/${item.id}/edit`}
                            className="inline-flex cursor-pointer items-center gap-1 text-sm font-medium text-primary hover:underline"
                          >
                            <Pencil aria-hidden className="h-3.5 w-3.5" />
                            Edit
                          </Link>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          {totalPages > 0 ? (
            <TablePagination
              page={page}
              totalPages={totalPages}
              total={total}
              label="accounts"
              disabled={isFetching}
              onPageChange={(next) => setPage(next)}
            />
          ) : null}
        </>
      )}
    </>
  );
}
