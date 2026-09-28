"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Eye, Search } from "lucide-react";
import { TablePagination } from "@/components/dashboard/TablePagination";
import { getApiErrorMessage } from "@/lib/getApiErrorMessage";
import {
  useGetDashboardAccountsPageQuery,
  useGetDashboardStatementQuery,
} from "@/features/school/api/accountingApi";
import { selectAuthReady } from "@/features/auth/authSlice";
import { useAppSelector } from "@/store/hooks";
import type { DashboardAccount } from "@/features/school/types";

const inputClass =
  "h-11 rounded-lg border border-border bg-white px-3 text-sm text-foreground";

function formatMoney(value: string, symbol: string, shortCode: string): string {
  const formatted = new Intl.NumberFormat("en", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value));
  return `${symbol ? `${symbol} ` : ""}${formatted} ${shortCode}`.trim();
}

function AccountPicker({
  selected,
  onSelect,
}: {
  selected: DashboardAccount | null;
  onSelect: (account: DashboardAccount | null) => void;
}) {
  const ready = useAppSelector(selectAuthReady);
  const [query, setQuery] = useState(
    selected ? `${selected.code} — ${selected.name}` : "",
  );
  const [debounced, setDebounced] = useState("");
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(query.trim()), 250);
    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!boxRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  const canSearch = ready && open && debounced.length >= 1;
  const { data, isFetching } = useGetDashboardAccountsPageQuery(
    { page: 1, limit: 20, search: debounced },
    { skip: !canSearch },
  );
  const options = data?.items ?? [];

  function pick(account: DashboardAccount) {
    onSelect(account);
    setQuery(`${account.code} — ${account.name}`);
    setOpen(false);
  }

  return (
    <div ref={boxRef} className="relative min-w-64 flex-1">
      <Search className="absolute left-3 top-3.5 h-4 w-4 text-muted" />
      <input
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={open}
        aria-controls="statement-account-list"
        autoComplete="off"
        value={query}
        placeholder="Search code, account, or parent name"
        onFocus={() => setOpen(true)}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
          onSelect(null);
        }}
        className="h-11 w-full rounded-lg border border-border pl-10 pr-3 text-sm"
      />
      {open ? (
        <ul
          id="statement-account-list"
          role="listbox"
          className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-border bg-white py-1 shadow-lg"
        >
          {debounced.length < 1 ? (
            <li className="px-3 py-3 text-sm text-muted">
              Type an account code or name
            </li>
          ) : isFetching ? (
            <li className="px-3 py-3 text-sm text-muted">Searching…</li>
          ) : options.length === 0 ? (
            <li className="px-3 py-3 text-sm text-muted">No accounts match</li>
          ) : (
            options.map((account) => (
              <li key={account.id} role="option" aria-selected={false}>
                <button
                  type="button"
                  onClick={() => pick(account)}
                  className="flex w-full cursor-pointer flex-col gap-0.5 px-3 py-2 text-left text-sm hover:bg-stone-50"
                >
                  <span className="font-medium text-foreground">
                    {account.code} — {account.name}
                  </span>
                  <span className="text-xs text-muted">
                    {account.type}
                    {account.relatedPerson
                      ? ` · ${account.relatedPerson.fullName}`
                      : ""}
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
      ) : null}
    </div>
  );
}

export function StatementOfAccount() {
  const ready = useAppSelector(selectAuthReady);
  const [account, setAccount] = useState<DashboardAccount | null>(null);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [documentType, setDocumentType] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const query = useMemo(
    () => ({
      accountId: account?.id ?? 0,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      documentType: documentType || undefined,
      search: search || undefined,
      page,
      limit: 50,
    }),
    [account, dateFrom, dateTo, documentType, search, page],
  );
  const statement = useGetDashboardStatementQuery(query, {
    skip: !ready || !account,
  });
  const rows = statement.data?.rows ?? [];
  const summaries = statement.data?.summaries ?? [];

  function resetPage() {
    setPage(1);
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted">
        Every movement comes from the posted journal, so invoices, receipts,
        payments, and manual records all appear here. Balance = running credit
        − debit: amounts owed display as negative.
      </p>
      <div className="flex flex-wrap gap-3 rounded-2xl border border-border bg-white p-4">
        <AccountPicker selected={account} onSelect={(next) => { setAccount(next); resetPage(); }} />
        <input
          aria-label="From date"
          type="date"
          value={dateFrom}
          onChange={(event) => {
            setDateFrom(event.target.value);
            resetPage();
          }}
          className={inputClass}
        />
        <input
          aria-label="To date"
          type="date"
          value={dateTo}
          onChange={(event) => {
            setDateTo(event.target.value);
            resetPage();
          }}
          className={inputClass}
        />
        <select
          aria-label="Document type"
          value={documentType}
          onChange={(event) => {
            setDocumentType(event.target.value);
            resetPage();
          }}
          className={inputClass}
        >
          <option value="">All documents</option>
          <option value="Invoice">Invoice</option>
          <option value="Receipt">Receipt</option>
          <option value="Payment">Payment</option>
          <option value="Record">Record</option>
        </select>
        <input
          aria-label="Search description"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            resetPage();
          }}
          placeholder="Search description"
          className={inputClass}
        />
      </div>

      {!account ? (
        <p className="rounded-2xl border border-border bg-white px-5 py-10 text-center text-sm text-muted">
          Select an account above to view its statement.
        </p>
      ) : statement.isLoading ? (
        <p className="rounded-2xl border border-border bg-white px-5 py-10 text-center text-sm text-muted">
          Loading statement…
        </p>
      ) : statement.error ? (
        <p
          className="rounded-2xl border border-border bg-white px-5 py-10 text-center text-sm text-red-700"
          role="alert"
        >
          {getApiErrorMessage(statement.error, "Could not load statement")}
        </p>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            {summaries.map((summary) => (
              <div
                key={summary.currencyId}
                className="rounded-2xl border border-border bg-white p-5"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                  {summary.symbol} {summary.shortCode}
                </p>
                <dl className="mt-3 space-y-1.5 text-sm">
                  <div className="flex justify-between gap-2">
                    <dt className="text-muted">Opening</dt>
                    <dd className="font-medium tabular-nums">
                      {formatMoney(summary.openingBalance, summary.symbol, summary.shortCode)}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-muted">Total debit</dt>
                    <dd className="font-medium tabular-nums">
                      {formatMoney(summary.totalDebit, summary.symbol, summary.shortCode)}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-muted">Total credit</dt>
                    <dd className="font-medium tabular-nums">
                      {formatMoney(summary.totalCredit, summary.symbol, summary.shortCode)}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-2 border-t border-border pt-1.5">
                    <dt className="font-semibold">Balance</dt>
                    <dd className="font-semibold tabular-nums">
                      {formatMoney(summary.closingBalance, summary.symbol, summary.shortCode)}
                    </dd>
                  </div>
                </dl>
              </div>
            ))}
            {summaries.length === 0 ? (
              <p className="rounded-2xl border border-border bg-white px-5 py-8 text-center text-sm text-muted sm:col-span-3">
                No movements in this range.
              </p>
            ) : null}
          </div>

          <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-stone-50 text-left text-xs uppercase text-muted">
                  <tr>
                    <th className="px-5 py-4">Date</th>
                    <th className="px-5 py-4">Document</th>
                    <th className="px-5 py-4">Description</th>
                    <th className="px-5 py-4 text-right">Debit</th>
                    <th className="px-5 py-4 text-right">Credit</th>
                    <th className="px-5 py-4 text-right">Balance</th>
                    <th className="px-5 py-4">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-5 py-10 text-center text-muted"
                      >
                        No rows in this range.
                      </td>
                    </tr>
                  ) : (
                    rows.map((row, index) => (
                      <tr key={`${row.date}-${index}`} className="border-t border-border">
                        <td className="px-5 py-4">
                          {new Date(row.date).toLocaleDateString()}
                        </td>
                        <td className="px-5 py-4 font-medium">
                          {row.documentType}
                          {row.documentNb !== null
                            ? ` #${row.documentNb}`
                            : ""}
                        </td>
                        <td className="max-w-52 truncate px-5 py-4">
                          {row.description ?? "—"}
                        </td>
                        <td className="px-5 py-4 text-right tabular-nums">
                          {Number(row.debit).toFixed(2)}
                        </td>
                        <td className="px-5 py-4 text-right tabular-nums">
                          {Number(row.credit).toFixed(2)}
                        </td>
                        <td className="px-5 py-4 text-right font-medium tabular-nums">
                          {Number(row.balance).toFixed(2)}{" "}
                          <span className="text-xs text-muted">
                            {row.currencyShortCode}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          {row.documentKind && row.documentId !== null ? (
                            <Link
                              aria-label={`View ${row.documentType} ${row.documentNb ?? ""}`.trim()}
                              href={`/accounting/${row.documentKind}/${row.documentId}`}
                              className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-xs font-medium"
                            >
                              <Eye className="h-3.5 w-3.5" /> View
                            </Link>
                          ) : (
                            <span className="text-xs text-muted">—</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
          {(statement.data?.totalPages ?? 0) > 0 ? (
            <TablePagination
              page={page}
              totalPages={statement.data?.totalPages ?? 0}
              total={statement.data?.total ?? 0}
              label="rows"
              disabled={statement.isFetching}
              onPageChange={setPage}
            />
          ) : null}
        </>
      )}
    </div>
  );
}
