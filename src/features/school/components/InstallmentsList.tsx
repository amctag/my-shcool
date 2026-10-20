"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { getApiErrorMessage } from "@/lib/getApiErrorMessage";
import { useGetYearsQuery } from "@/features/school/api/sectionsApi";
import {
  useCreateDashboardInstallmentBatchMutation,
  useDeleteDashboardInstallmentMutation,
  useGetDashboardInstallmentsQuery,
  useGetDashboardReceiptsQuery,
  useLinkDashboardInstallmentReceiptMutation,
  useUnlinkDashboardInstallmentReceiptMutation,
} from "@/features/school/api/accountingApi";
import { PostingAccountSelect } from "@/features/school/components/PostingAccountSelect";
import type { DashboardInstallment, DashboardPostingLookup } from "@/features/school/types";

const inputClass = "h-11 rounded-xl border border-border bg-white px-3 text-sm";
type DraftRow = { amount: string; date: string };

export function InstallmentsList() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<"all" | "paid" | "unpaid">("all");
  const [yearId, setYearId] = useState("");
  const [account, setAccount] = useState<DashboardPostingLookup | null>(null);
  const [date, setDate] = useState("");
  const [rows, setRows] = useState<DraftRow[]>([{ amount: "", date: "" }]);
  const [selected, setSelected] = useState<DashboardInstallment | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { data: years = [] } = useGetYearsQuery();
  const filters = { page, limit: 100, ...(account ? { accountId: account.id } : {}), ...(yearId ? { yearId: Number(yearId) } : {}), ...(status === "all" ? {} : { paid: status === "paid" }), ...(date ? { date } : {}) };
  const { data, isLoading, isFetching } = useGetDashboardInstallmentsQuery(filters);
  const { data: receipts } = useGetDashboardReceiptsQuery({ page: 1, limit: 500 });
  const [createBatch, createState] = useCreateDashboardInstallmentBatchMutation();
  const [deleteInstallment] = useDeleteDashboardInstallmentMutation();
  const [linkReceipt] = useLinkDashboardInstallmentReceiptMutation();
  const [unlinkReceipt] = useUnlinkDashboardInstallmentReceiptMutation();

  function updateRow(index: number, patch: Partial<DraftRow>) {
    setRows((current) => current.map((row, rowIndex) => rowIndex === index ? { ...row, ...patch } : row));
  }
  async function saveBatch() {
    if (!account || !yearId) { setError("Choose an account and school year."); return; }
    if (rows.some((row) => !Number(row.amount) || Number(row.amount) <= 0)) { setError("Every installment amount must be greater than zero."); return; }
    try {
      await createBatch({ rows: rows.map((row) => ({ accountId: account.id, yearId: Number(yearId), amount: Number(row.amount), date: row.date || undefined })) }).unwrap();
      setRows([{ amount: "", date: "" }]);
      setError(null);
    } catch (caught) { setError(getApiErrorMessage(caught, "Could not create installments")); }
  }
  async function remove(item: DashboardInstallment) {
    if (!window.confirm(`Delete installment #${item.id}?`)) return;
    try { await deleteInstallment(item.id).unwrap(); } catch (caught) { setError(getApiErrorMessage(caught, "Could not delete installment")); }
  }
  const eligible = receipts?.items ?? [];

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-border bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-4">
          <PostingAccountSelect id="installment-filter-account" family="4" value={account} onChange={setAccount} placeholder="Filter account" />
          <select className={inputClass} value={yearId} onChange={(event) => { setYearId(event.target.value); setPage(1); }}><option value="">All years</option>{years.map((year) => <option key={year.id} value={year.id}>{year.title}</option>)}</select>
          <select className={inputClass} value={status} onChange={(event) => { setStatus(event.target.value as typeof status); setPage(1); }}><option value="all">All statuses</option><option value="unpaid">Unpaid</option><option value="paid">Paid</option></select>
          <input className={inputClass} type="date" value={date} onChange={(event) => { setDate(event.target.value); setPage(1); }} />
        </div>
      </div>
      <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold">Create installments</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2"><PostingAccountSelect id="installment-create-account" family="4" value={account} onChange={setAccount} placeholder="Parent, teacher, or posting account" /><select className={inputClass} value={yearId} onChange={(event) => setYearId(event.target.value)}><option value="">Select school year</option>{years.map((year) => <option key={year.id} value={year.id}>{year.title}</option>)}</select></div>
        <div className="mt-4 space-y-3">{rows.map((row, index) => <div key={index} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]"><input className={inputClass} type="number" min="0.01" step="0.01" placeholder={`Amount ${index + 1}`} value={row.amount} onChange={(event) => updateRow(index, { amount: event.target.value })} /><input className={inputClass} type="date" value={row.date} onChange={(event) => updateRow(index, { date: event.target.value })} /><button type="button" disabled={rows.length === 1} onClick={() => setRows((current) => current.filter((_, rowIndex) => rowIndex !== index))} className="rounded-xl border border-border px-3 text-sm disabled:opacity-40">Remove</button></div>)}</div>
        {error && <p className="mt-3 text-sm text-red-600" role="alert">{error}</p>}
        <div className="mt-4 flex flex-wrap gap-2"><button type="button" onClick={() => setRows((current) => [...current, { amount: "", date: "" }])} className="rounded-xl border border-border px-4 py-2 text-sm">Add row</button><button type="button" disabled={createState.isLoading} onClick={() => void saveBatch()} className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white">{createState.isLoading ? "Saving…" : "Save installments"}</button></div>
      </div>
      <div className={`overflow-x-auto rounded-2xl border border-border bg-white shadow-sm ${isFetching ? "opacity-70" : ""}`}><table className="min-w-full text-left text-sm"><thead><tr className="border-b border-border"><th className="px-4 py-3">ID</th><th className="px-4 py-3">Account</th><th className="px-4 py-3">Amount</th><th className="px-4 py-3">Due date</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Receipt</th><th className="px-4 py-3">Actions</th></tr></thead><tbody>{isLoading ? <tr><td colSpan={7} className="p-8 text-center">Loading installments…</td></tr> : !data?.items.length ? <tr><td colSpan={7} className="p-8 text-center text-muted">No installments found.</td></tr> : data.items.map((item) => <tr key={item.id} className="border-b border-stone-100"><td className="px-4 py-3">{item.id}</td><td className="px-4 py-3 font-medium">{item.account.name}<span className="ml-2 text-xs text-muted">{item.account.code}</span></td><td className="px-4 py-3">{item.amount}</td><td className="px-4 py-3">{item.date?.slice(0, 10) ?? "—"}</td><td className="px-4 py-3"><span className={item.paid ? "text-emerald-700" : "text-amber-700"}>{item.paid ? "Paid" : "Unpaid"}</span></td><td className="px-4 py-3">{item.receiptId ? <Link className="text-primary underline" href={`/accounting/receipts/${item.receiptId}`}>#{item.receiptId}</Link> : <select className="h-9 rounded-lg border border-border" defaultValue="" onChange={async (event) => { if (event.target.value) try { await linkReceipt({ id: item.id, receiptId: Number(event.target.value) }).unwrap(); } catch (caught) { setError(getApiErrorMessage(caught, "Could not link receipt")); } }}><option value="">Link receipt</option>{eligible.filter((receipt) => receipt.accountId === item.accountId && Number(receipt.amount) === Number(item.amount)).map((receipt) => <option key={receipt.id} value={receipt.id}>#{receipt.id}</option>)}</select>}</td><td className="px-4 py-3"><div className="flex flex-wrap gap-2"><button type="button" onClick={() => setSelected(item)} className="rounded-lg border border-border px-3 py-1.5 text-xs">View</button>{!item.paid && <button type="button" onClick={() => router.push(`/accounting/receipts/add?installmentId=${item.id}&accountId=${item.accountId}&amount=${item.amount}`)} className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white">Paid</button>}{item.paid && <button type="button" onClick={() => void unlinkReceipt(item.id)} className="rounded-lg border border-border px-3 py-1.5 text-xs">Unlink</button>}{!item.paid && <button type="button" onClick={() => void remove(item)} className="rounded-lg border border-red-200 px-3 py-1.5 text-xs text-red-600">Delete</button>}</div></td></tr>)}</tbody></table></div>
      {data && data.totalPages > 1 && <div className="flex items-center justify-between"><button type="button" disabled={page <= 1} onClick={() => setPage((current) => current - 1)} className="rounded-xl border border-border px-4 py-2 text-sm disabled:opacity-40">Previous</button><span className="text-sm text-muted">Page {data.page} of {data.totalPages} · {data.total} total</span><button type="button" disabled={page >= data.totalPages} onClick={() => setPage((current) => current + 1)} className="rounded-xl border border-border px-4 py-2 text-sm disabled:opacity-40">Next</button></div>}
      {selected && <div className="fixed inset-0 z-50 flex items-center justify-center p-4"><button className="absolute inset-0 bg-black/40" aria-label="Close" onClick={() => setSelected(null)} /><div className="relative z-10 w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"><h2 className="text-xl font-semibold">Installment #{selected.id}</h2><dl className="mt-4 grid grid-cols-2 gap-3 text-sm"><dt className="text-muted">Account</dt><dd>{selected.account.name} ({selected.account.code})</dd><dt className="text-muted">Amount</dt><dd>{selected.amount}</dd><dt className="text-muted">Due date</dt><dd>{selected.date?.slice(0, 10) ?? "—"}</dd><dt className="text-muted">School year</dt><dd>{selected.year.title}</dd><dt className="text-muted">Status</dt><dd>{selected.paid ? "Paid" : "Unpaid"}</dd><dt className="text-muted">Receipt</dt><dd>{selected.receiptId ? <Link className="text-primary underline" href={`/accounting/receipts/${selected.receiptId}`}>#{selected.receiptId}</Link> : "—"}</dd><dt className="text-muted">Created</dt><dd>{new Date(selected.dateCreated).toLocaleString()}</dd></dl><button type="button" onClick={() => setSelected(null)} className="mt-6 rounded-xl border border-border px-4 py-2 text-sm">Close</button></div></div>}
    </div>
  );
}
