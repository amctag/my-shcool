"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, Plus, Search } from "lucide-react";
import { TablePagination } from "@/components/dashboard/TablePagination";
import { getApiErrorMessage } from "@/lib/getApiErrorMessage";
import {
  useGetDashboardCurrenciesQuery,
  useGetDashboardRecordsQuery,
} from "@/features/school/api/accountingApi";

export function RecordsList() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [currencyId, setCurrencyId] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const response = useGetDashboardRecordsQuery({
    page,
    limit: 10,
    search: search || undefined,
    currencyId: currencyId ? Number(currencyId) : undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  });
  const currencies = useGetDashboardCurrenciesQuery();
  const rows = response.data?.items ?? [];
  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
        <p className="text-sm text-muted">
          Manual balanced journal entries. Every record posts one register
          with equal debit and credit totals.
        </p>
        <Link
          href="/accounting/records/add"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-on-primary"
        >
          <Plus className="h-4 w-4" /> New record
        </Link>
      </div>
      <div className="flex flex-wrap gap-3 rounded-2xl border border-border bg-white p-4">
        <label className="relative min-w-56 flex-1">
          <Search className="absolute left-3 top-3.5 h-4 w-4 text-muted" />
          <input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Search description"
            className="h-11 w-full rounded-lg border border-border pl-10 pr-3 text-sm"
          />
        </label>
        <select
          value={currencyId}
          onChange={(event) => {
            setCurrencyId(event.target.value);
            setPage(1);
          }}
          className="h-11 rounded-lg border border-border bg-white px-3 text-sm"
        >
          <option value="">All currencies</option>
          {currencies.data?.map((currency) => (
            <option key={currency.id} value={currency.id}>
              {currency.symbol} / {currency.shortCode}
            </option>
          ))}
        </select>
        <input
          aria-label="From date"
          type="date"
          value={dateFrom}
          onChange={(event) => {
            setDateFrom(event.target.value);
            setPage(1);
          }}
          className="h-11 rounded-lg border border-border bg-white px-3 text-sm"
        />
        <input
          aria-label="To date"
          type="date"
          value={dateTo}
          onChange={(event) => {
            setDateTo(event.target.value);
            setPage(1);
          }}
          className="h-11 rounded-lg border border-border bg-white px-3 text-sm"
        />
      </div>
      <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-stone-50 text-left text-xs uppercase text-muted">
              <tr>
                <th className="px-5 py-4">Record #</th>
                <th className="px-5 py-4">Date</th>
                <th className="px-5 py-4">Description</th>
                <th className="px-5 py-4">Currency</th>
                <th className="px-5 py-4 text-right">Total debit</th>
                <th className="px-5 py-4 text-right">Total credit</th>
                <th className="px-5 py-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {response.isLoading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-muted">
                    Loading records…
                  </td>
                </tr>
              ) : response.error ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-10 text-center text-red-700"
                  >
                    {getApiErrorMessage(response.error, "Could not load records")}
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-muted">
                    No records found.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id} className="border-t border-border">
                    <td className="px-5 py-4 font-medium">#{row.nb}</td>
                    <td className="px-5 py-4">
                      {new Date(row.dateCreated).toLocaleDateString()}
                    </td>
                    <td className="max-w-52 truncate px-5 py-4">
                      {row.description ?? "—"}
                    </td>
                    <td className="px-5 py-4">
                      {row.currency
                        ? `${row.currency.symbol} / ${row.currency.shortCode}`
                        : "—"}
                    </td>
                    <td className="px-5 py-4 text-right font-medium tabular-nums">
                      {Number(row.totalDebit).toFixed(2)}
                    </td>
                    <td className="px-5 py-4 text-right font-medium tabular-nums">
                      {Number(row.totalCredit).toFixed(2)}
                    </td>
                    <td className="px-5 py-4">
                      <Link
                        aria-label={`View record ${row.nb}`}
                        href={`/accounting/records/${row.id}`}
                        className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-xs font-medium"
                      >
                        <Eye className="h-3.5 w-3.5" /> View
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
          label="records"
          disabled={response.isFetching}
          onPageChange={setPage}
        />
      ) : null}
    </div>
  );
}
