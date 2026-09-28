"use client";

import Link from "next/link";
import { getApiErrorMessage } from "@/lib/getApiErrorMessage";
import { LoadingDots } from "@/components/dashboard/TableLoading";
import { useGetDashboardRecordQuery } from "@/features/school/api/accountingApi";

export function RecordDetail({ id }: { id: number }) {
  const { data: document, error, isLoading } = useGetDashboardRecordQuery(id);
  if (isLoading) {
    return <LoadingDots label="Loading record" />;
  }
  if (error || !document) {
    return (
      <p
        className="rounded-2xl border border-border bg-white px-5 py-8 text-center text-sm text-red-600"
        role="alert"
      >
        {getApiErrorMessage(error, "Could not load record")}
      </p>
    );
  }
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-border bg-white p-6">
        <div>
          <p className="text-sm text-muted">
            {new Date(document.dateCreated).toLocaleDateString()}
          </p>
          <h1 className="text-2xl font-semibold">#{document.nb}</h1>
        </div>
        <div className="text-right text-sm tabular-nums">
          <p>
            Debit{" "}
            <span className="font-semibold">
              {document.currency?.symbol}
              {Number(document.totalDebit).toFixed(2)}
            </span>
          </p>
          <p>
            Credit{" "}
            <span className="font-semibold">
              {document.currency?.symbol}
              {Number(document.totalCredit).toFixed(2)}
            </span>
          </p>
        </div>
      </div>
      <dl className="grid gap-4 border-y border-border py-5 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <dt className="text-xs uppercase text-muted">Currency</dt>
          <dd className="mt-1 text-sm font-medium">
            {document.currency
              ? `${document.currency.symbol} / ${document.currency.shortCode}`
              : "—"}
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase text-muted">Rate</dt>
          <dd className="mt-1 text-sm font-medium">
            {document.currencyRate ?? "—"}
          </dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-xs uppercase text-muted">Description</dt>
          <dd className="mt-1 text-sm font-medium">
            {document.description ?? "—"}
          </dd>
        </div>
        {document.notes ? (
          <div className="sm:col-span-2">
            <dt className="text-xs uppercase text-muted">Notes</dt>
            <dd className="mt-1 text-sm font-medium">{document.notes}</dd>
          </div>
        ) : null}
      </dl>
      <div className="overflow-hidden rounded-2xl border border-border bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-stone-50 text-left text-xs uppercase text-muted">
              <tr>
                <th className="px-5 py-4">Account</th>
                <th className="px-5 py-4">Description</th>
                <th className="px-5 py-4 text-right">Debit</th>
                <th className="px-5 py-4 text-right">Credit</th>
              </tr>
            </thead>
            <tbody>
              {document.rows.map((row, index) => (
                <tr key={`${row.accountId}-${index}`} className="border-t border-border">
                  <td className="px-5 py-4">
                    <p className="font-medium">
                      {row.accountCode} — {row.accountName}
                    </p>
                  </td>
                  <td className="px-5 py-4">{row.description ?? "—"}</td>
                  <td className="px-5 py-4 text-right tabular-nums">
                    {Number(row.debit).toFixed(2)}
                  </td>
                  <td className="px-5 py-4 text-right tabular-nums">
                    {Number(row.credit).toFixed(2)}
                  </td>
                </tr>
              ))}
              <tr className="border-t-2 border-border bg-stone-50 font-semibold">
                <td className="px-5 py-4" colSpan={2}>
                  Total
                </td>
                <td className="px-5 py-4 text-right tabular-nums">
                  {Number(document.totalDebit).toFixed(2)}
                </td>
                <td className="px-5 py-4 text-right tabular-nums">
                  {Number(document.totalCredit).toFixed(2)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <p className="text-sm font-medium text-green-700">
        Balanced — debit equals credit.
      </p>
      <Link
        href="/accounting/records"
        className="inline-flex h-11 items-center justify-center rounded-lg border border-border bg-white px-5 text-sm font-medium text-foreground hover:bg-stone-50"
      >
        Back to records
      </Link>
    </div>
  );
}
