"use client";

import { LoadingDots } from "@/components/dashboard/TableLoading";
import Link from "next/link";
import { getApiErrorMessage } from "@/lib/getApiErrorMessage";
import {
  useGetDashboardPaymentQuery,
  useGetDashboardReceiptQuery,
} from "@/features/school/api/accountingApi";

export function AccountingDocumentDetail({
  kind,
  id,
}: {
  kind: "receipt" | "payment";
  id: number;
}) {
  const receipt = useGetDashboardReceiptQuery(id, { skip: kind !== "receipt" });
  const payment = useGetDashboardPaymentQuery(id, { skip: kind !== "payment" });
  const query = kind === "receipt" ? receipt : payment;
  if (query.isLoading) return <LoadingDots label={`Loading ${kind}`} />;
  if (query.error || !query.data)
    return (
      <p role="alert" className="rounded-xl bg-red-50 p-4 text-red-700">
        {getApiErrorMessage(query.error, `Could not load ${kind}`)}
      </p>
    );
  const document = query.data;
  const fromName =
    "parentName" in document ? document.parentName : document.accountName;
  return (
    <div className="space-y-5 rounded-2xl border border-border bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted">
            {kind === "receipt" ? "Receipt" : "Payment"}
          </p>
          <h1 className="text-2xl font-semibold">#{document.nb}</h1>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={`/accounting/${kind === "receipt" ? "receipts" : "payments"}/${id}/edit`}
            className="rounded-lg border border-border px-3 py-2 text-sm"
          >
            Edit
          </Link>
          <p className="text-lg font-semibold">
            {document.currency?.symbol}
            {Number(document.total).toFixed(2)} {document.currency?.shortCode}
          </p>
        </div>
      </div>
      <dl className="grid gap-4 border-y border-border py-5 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <dt className="text-xs uppercase text-muted">
            {kind === "receipt" ? "From account" : "To account"}
          </dt>
          <dd className="mt-1 font-medium">{fromName}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase text-muted">Account code</dt>
          <dd className="mt-1">{document.accountCode}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase text-muted">Date</dt>
          <dd className="mt-1">
            {new Date(document.dateCreated).toLocaleDateString()}
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase text-muted">Rate snapshot</dt>
          <dd className="mt-1">{document.currencyRate ?? "—"}</dd>
        </div>
      </dl>
      <div>
        <h2 className="font-semibold">
          {kind === "receipt"
            ? "Destination allocations"
            : "Funding allocations"}
        </h2>
        <div className="mt-3 overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-stone-50 text-left text-muted">
              <tr>
                <th className="px-4 py-3">Account</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {document.allocations.map((allocation) => (
                <tr
                  key={allocation.accountId}
                  className="border-t border-border"
                >
                  <td className="px-4 py-3">
                    {allocation.accountCode} — {allocation.accountName}
                  </td>
                  <td className="px-4 py-3">{allocation.description ?? "—"}</td>
                  <td className="px-4 py-3 text-right font-medium">
                    {document.currency?.symbol}
                    {Number(allocation.amount).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <dl className="grid gap-4 sm:grid-cols-3">
        <div>
          <dt className="text-xs uppercase text-muted">Description</dt>
          <dd>{document.description ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase text-muted">Notes</dt>
          <dd>{document.notes ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase text-muted">Internal comment</dt>
          <dd>{document.comments ?? "—"}</dd>
        </div>
      </dl>
      <p className="rounded-xl bg-stone-50 p-3 text-sm text-muted">
        Journal:{" "}
        {kind === "receipt"
          ? `${document.allocations.length} destination debit(s), one parent credit`
          : `one destination debit, ${document.allocations.length} funding credit(s)`}
        . Debit and credit total {document.total}.
      </p>
    </div>
  );
}
