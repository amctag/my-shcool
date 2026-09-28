"use client";

import Link from "next/link";
import { getApiErrorMessage } from "@/lib/getApiErrorMessage";
import { LoadingDots } from "@/components/dashboard/TableLoading";
import { useGetDashboardInvoiceQuery } from "@/features/school/api/accountingApi";

export function InvoiceDetail({ id }: { id: number }) {
  const { data: document, error, isLoading } = useGetDashboardInvoiceQuery(id);
  if (isLoading) {
    return <LoadingDots label="Loading invoice" />;
  }
  if (error || !document) {
    return (
      <p
        className="rounded-2xl border border-border bg-white px-5 py-8 text-center text-sm text-red-600"
        role="alert"
      >
        {getApiErrorMessage(error, "Could not load invoice")}
      </p>
    );
  }
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-border bg-white p-6">
        <div>
          <p className="text-sm text-muted">
            {new Date(document.dateCreated).toLocaleDateString()} ·{" "}
            {document.parentName} · Account {document.accountCode}
          </p>
          <h1 className="text-2xl font-semibold">#{document.nb}</h1>
        </div>
        <p className="text-lg font-semibold">
          {document.currency?.symbol}
          {Number(document.total).toFixed(2)} {document.currency?.shortCode}
        </p>
      </div>
      <dl className="grid gap-4 border-y border-border py-5 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <dt className="text-xs uppercase text-muted">Parent</dt>
          <dd className="mt-1 text-sm font-medium">{document.parentName}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase text-muted">Account code</dt>
          <dd className="mt-1 text-sm font-medium">{document.accountCode}</dd>
        </div>
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
      </dl>
      {document.description ? (
        <p className="text-sm text-muted">{document.description}</p>
      ) : null}
      <div className="overflow-hidden rounded-2xl border border-border bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-stone-50 text-left text-xs uppercase text-muted">
              <tr>
                <th className="px-5 py-4">Item</th>
                <th className="px-5 py-4 text-right">Price</th>
                <th className="px-5 py-4 text-right">Qty</th>
                <th className="px-5 py-4 text-right">Line total</th>
                <th className="px-5 py-4">For student</th>
              </tr>
            </thead>
            <tbody>
              {document.details.map((line) => (
                <tr key={line.id} className="border-t border-border">
                  <td className="px-5 py-4 font-medium">{line.itemName}</td>
                  <td className="px-5 py-4 text-right">
                    {Number(line.unitPrice).toFixed(2)}
                  </td>
                  <td className="px-5 py-4 text-right">
                    {Number(line.quantity).toFixed(3)}
                  </td>
                  <td className="px-5 py-4 text-right font-medium">
                    {Number(line.lineTotal).toFixed(2)}
                  </td>
                  <td className="px-5 py-4">
                    {line.forRegistrationLabel ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <p className="text-sm text-muted">
        Journal: parent debit {Number(document.total).toFixed(2)} / sales
        credit {Number(document.total).toFixed(2)}. Debit and credit total{" "}
        {document.total}.
      </p>
      <Link
        href="/accounting/invoices"
        className="inline-flex h-11 items-center justify-center rounded-lg border border-border bg-white px-5 text-sm font-medium text-foreground hover:bg-stone-50"
      >
        Back to invoices
      </Link>
    </div>
  );
}
