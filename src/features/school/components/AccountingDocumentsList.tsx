"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, Pencil, Plus, Search } from "lucide-react";
import { TablePagination } from "@/components/dashboard/TablePagination";
import { getApiErrorMessage } from "@/lib/getApiErrorMessage";
import {
  useGetDashboardCurrenciesQuery,
  useGetDashboardPaymentsQuery,
  useGetDashboardReceiptsQuery,
} from "@/features/school/api/accountingApi";
import type { DashboardPostingLookup } from "@/features/school/types";
import { PostingAccountSelect } from "@/features/school/components/PostingAccountSelect";

type AppliedFilters = {
  search?: string;
  currencyId?: number;
  dateFrom?: string;
  dateTo?: string;
  accountId?: number;
};

export function AccountingDocumentsList({
  kind,
}: {
  kind: "receipts" | "payments";
}) {
  const [page, setPage] = useState(1);
  const [applied, setApplied] = useState<AppliedFilters>({});
  const [draftSearch, setDraftSearch] = useState("");
  const [draftCurrencyId, setDraftCurrencyId] = useState("");
  const [draftDateFrom, setDraftDateFrom] = useState("");
  const [draftDateTo, setDraftDateTo] = useState("");
  const [draftAccount, setDraftAccount] =
    useState<DashboardPostingLookup | null>(null);
  const [filterError, setFilterError] = useState<string | null>(null);

  const query = {
    page,
    limit: 10,
    ...applied,
  };
  const receipts = useGetDashboardReceiptsQuery(query, {
    skip: kind !== "receipts",
  });
  const payments = useGetDashboardPaymentsQuery(query, {
    skip: kind !== "payments",
  });
  const currencies = useGetDashboardCurrenciesQuery();
  const response = kind === "receipts" ? receipts : payments;
  const rows = response.data?.items ?? [];

  function applySearch() {
    if (draftDateFrom && draftDateTo && draftDateFrom > draftDateTo) {
      setFilterError("The from date must be earlier than or equal to the to date.");
      return;
    }
    setFilterError(null);
    setApplied({
      search: draftSearch.trim() || undefined,
      currencyId: draftCurrencyId ? Number(draftCurrencyId) : undefined,
      dateFrom: draftDateFrom || undefined,
      dateTo: draftDateTo || undefined,
      accountId: draftAccount?.id,
    });
    setPage(1);
  }

  function clearFilters() {
    setDraftSearch("");
    setDraftCurrencyId("");
    setDraftDateFrom("");
    setDraftDateTo("");
    setDraftAccount(null);
    setFilterError(null);
    setApplied({});
    setPage(1);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
        <p className="text-sm text-muted">
          Professional, balanced {kind} posted to one accounting register per
          document.
        </p>
        <Link
          href={`/accounting/${kind}/add`}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-on-primary"
        >
          <Plus className="h-4 w-4" /> New {kind.slice(0, -1)}
        </Link>
      </div>
      <div className="space-y-3 rounded-2xl border border-border bg-white p-4">
        <div className="flex flex-wrap gap-3">
          <label className="relative min-w-56 flex-1">
            <Search className="absolute left-3 top-3.5 h-4 w-4 text-muted" />
            <input
              value={draftSearch}
              onChange={(event) => setDraftSearch(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  applySearch();
                }
              }}
              placeholder="Search account or description"
              aria-label="Search account or description"
              className="h-11 w-full rounded-lg border border-border pl-10 pr-3 text-sm"
            />
          </label>
          <div className="min-w-64 flex-1">
            <PostingAccountSelect
              id={`${kind}-account-filter`}
              family="4"
              value={draftAccount}
              onChange={setDraftAccount}
              placeholder="Filter by account — name or code"
            />
          </div>
          <select
            value={draftCurrencyId}
            onChange={(event) => setDraftCurrencyId(event.target.value)}
            aria-label="Currency"
            className="h-11 rounded-lg border border-border bg-white px-3 text-sm"
          >
            <option value="">All currencies</option>
            {currencies.data?.map((currency) => (
              <option key={currency.id} value={currency.id}>
                {currency.symbol} / {currency.shortCode}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <label className="block text-sm">
            <span className="mb-1 block text-xs font-medium text-muted">
              From date
            </span>
            <input
              type="date"
              value={draftDateFrom}
              onChange={(event) => setDraftDateFrom(event.target.value)}
              className="h-11 rounded-lg border border-border bg-white px-3 text-sm"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-xs font-medium text-muted">
              To date
            </span>
            <input
              type="date"
              value={draftDateTo}
              onChange={(event) => setDraftDateTo(event.target.value)}
              className="h-11 rounded-lg border border-border bg-white px-3 text-sm"
            />
          </label>
          <button
            type="button"
            onClick={applySearch}
            className="inline-flex h-11 items-center gap-2 rounded-lg bg-primary px-5 text-sm font-medium text-on-primary"
          >
            <Search className="h-4 w-4" /> Search
          </button>
          <button
            type="button"
            onClick={clearFilters}
            className="inline-flex h-11 items-center rounded-lg border border-border bg-white px-5 text-sm font-medium"
          >
            Clear
          </button>
        </div>
        {filterError ? (
          <p className="text-sm text-red-600" role="alert">
            {filterError}
          </p>
        ) : null}
      </div>
      <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-stone-50 text-left text-xs uppercase text-muted">
              <tr>
                <th className="px-5 py-4">
                  {kind === "receipts" ? "Receipt" : "Payment"} #
                </th>
                <th className="px-5 py-4">Date</th>
                <th className="px-5 py-4">
                  {kind === "receipts" ? "Parent / From" : "To Account"}
                </th>
                <th className="px-5 py-4">Account Code</th>
                <th className="px-5 py-4">Currency</th>
                <th className="px-5 py-4 text-right">Total</th>
                <th className="px-5 py-4">Description</th>
                <th className="px-5 py-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {response.isLoading ? (
                <tr>
                  <td colSpan={8} className="px-5 py-10 text-center text-muted">
                    Loading {kind}…
                  </td>
                </tr>
              ) : response.error ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-5 py-10 text-center text-red-700"
                  >
                    {getApiErrorMessage(
                      response.error,
                      `Could not load ${kind}`,
                    )}
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-10 text-center text-muted">
                    No {kind} found.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id} className="border-t border-border">
                    <td className="px-5 py-4 font-medium">#{row.nb}</td>
                    <td className="flex gap-2 px-5 py-4">
                      {new Date(row.dateCreated).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-4">
                      {"parentName" in row ? row.parentName : row.accountName}
                    </td>
                    <td className="px-5 py-4">{row.accountCode}</td>
                    <td className="px-5 py-4">
                      {row.currency
                        ? `${row.currency.symbol} / ${row.currency.shortCode}`
                        : "—"}
                    </td>
                    <td className="px-5 py-4 text-right font-medium">
                      {row.currency?.symbol}
                      {Number(row.total).toFixed(2)}
                    </td>
                    <td className="max-w-52 truncate px-5 py-4">
                      {row.description ?? "—"}
                    </td>
                    <td className="px-5 py-4">
                      <Link
                        aria-label={`View ${kind.slice(0, -1)} ${row.nb}`}
                        href={`/accounting/${kind}/${row.id}`}
                        className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-xs font-medium"
                      >
                        <Eye className="h-3.5 w-3.5" /> View
                      </Link>
                      <Link
                        aria-label={`Edit ${kind.slice(0, -1)} ${row.nb}`}
                        href={`/accounting/${kind}/${row.id}/edit`}
                        className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-xs font-medium"
                      >
                        <Pencil className="h-3.5 w-3.5" /> Edit
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      {(response.data?.totalPages ?? 0) > 0 ? (
        <TablePagination
          page={page}
          totalPages={response.data?.totalPages ?? 0}
          total={response.data?.total ?? 0}
          label={kind}
          disabled={response.isFetching}
          onPageChange={setPage}
        />
      ) : null}
    </div>
  );
}
