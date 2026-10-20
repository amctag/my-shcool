"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BackLink } from "@/components/dashboard/BackLink";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { PostingAccountSelect } from "@/features/school/components/PostingAccountSelect";
import { useGetYearsQuery } from "@/features/school/api/sectionsApi";
import { useCreateDashboardInstallmentBatchMutation } from "@/features/school/api/accountingApi";
import { getApiErrorMessage } from "@/lib/getApiErrorMessage";
import type { DashboardPostingLookup } from "@/features/school/types";

const inputClass = "h-11 w-full rounded-xl border border-border bg-white px-3 text-sm";
type PaymentRow = { amount: string; date: string };

export default function AddInstallmentsPage() {
  const router = useRouter();
  const { data: years = [] } = useGetYearsQuery();
  const [account, setAccount] = useState<DashboardPostingLookup | null>(null);
  const [yearId, setYearId] = useState("");
  const [rows, setRows] = useState<PaymentRow[]>([{ amount: "", date: "" }]);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [createBatch, state] = useCreateDashboardInstallmentBatchMutation();
  const total = rows.reduce((sum, row) => sum + (Number(row.amount) || 0), 0);

  function updateRow(index: number, patch: Partial<PaymentRow>) {
    setRows((current) => current.map((row, rowIndex) => rowIndex === index ? { ...row, ...patch } : row));
  }
  async function submit() {
    const invalidIndex = rows.findIndex((row) => Number(row.amount) <= 0 || !row.date);
    if (!account) { setError("Select an account."); return; }
    if (!yearId) { setError("Select a school year."); return; }
    if (invalidIndex >= 0) { setError(`Enter a positive amount and due date for payment ${invalidIndex + 1}.`); return; }
    try {
      await createBatch({ rows: rows.map((row) => ({ accountId: account.id, yearId: Number(yearId), amount: Number(row.amount), date: row.date })) }).unwrap();
      setSaved(true);
      window.setTimeout(() => router.push("/accounting/installments"), 700);
    } catch (caught) { setError(getApiErrorMessage(caught, "Could not save installments")); }
  }

  return <div className="space-y-4"><BackLink href="/accounting/installments">Back to Installments</BackLink><PageHeader title="Add Installments" description="Create a payment schedule for an account" /><div className="rounded-2xl border border-border bg-white p-5 shadow-sm sm:p-6"><section><h2 className="text-base font-semibold">Account &amp; School Year</h2><div className="mt-4 grid gap-4 md:grid-cols-2"><PostingAccountSelect id="installment-add-account" family="4" value={account} onChange={setAccount} placeholder="Search account name or code" /><select className={inputClass} value={yearId} onChange={(event) => setYearId(event.target.value)}><option value="">Select school year</option>{years.map((year) => <option key={year.id} value={year.id}>{year.title}</option>)}</select></div></section><section className="mt-8"><div className="flex items-center justify-between"><h2 className="text-base font-semibold">Payment Schedule</h2><button type="button" onClick={() => setRows((current) => [...current, { amount: "", date: "" }])} className="text-sm font-semibold text-primary">+ Add Payment</button></div><div className="mt-3 overflow-hidden rounded-xl border border-border"><div className="hidden grid-cols-[3rem_1fr_1fr_5rem] gap-3 bg-stone-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted sm:grid"><span>#</span><span>Amount</span><span>Due Date</span><span>Remove</span></div>{rows.map((row, index) => <div key={index} className="grid gap-3 border-t border-border px-4 py-3 first:border-t-0 sm:grid-cols-[3rem_1fr_1fr_5rem] sm:items-center"><span className="text-sm font-semibold text-muted">{index + 1}</span><input className={inputClass} type="number" min="0.01" step="0.01" placeholder="0.00" value={row.amount} onChange={(event) => updateRow(index, { amount: event.target.value })} /><input className={inputClass} type="date" value={row.date} onChange={(event) => updateRow(index, { date: event.target.value })} /><button type="button" disabled={rows.length === 1} onClick={() => setRows((current) => current.filter((_, rowIndex) => rowIndex !== index))} className="text-left text-sm text-red-600 disabled:opacity-40 sm:text-center">Remove</button></div>)}</div></section><section className="mt-6 rounded-xl bg-stone-50 px-4 py-3"><h2 className="text-sm font-semibold">Schedule Summary</h2><div className="mt-2 flex gap-8 text-sm text-muted"><span>{rows.length} installment{rows.length === 1 ? "" : "s"}</span><span className="font-semibold text-foreground">Total: {total.toFixed(2)}</span></div></section>{error && <p className="mt-4 text-sm text-red-600" role="alert">{error}</p>}{saved && <p className="mt-4 text-sm text-emerald-700" role="status">Installments saved. Returning to the list…</p>}<div className="mt-6 flex justify-end gap-3"><button type="button" onClick={() => router.push("/accounting/installments")} className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium">Cancel</button><button type="button" onClick={() => void submit()} disabled={state.isLoading || saved} className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60">{state.isLoading ? "Saving…" : "Save Installments"}</button></div></div></div>;
}
