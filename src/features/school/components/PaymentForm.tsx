"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Plus, Trash2 } from "lucide-react";
import { LoadingDots } from "@/components/dashboard/TableLoading";
import { getApiErrorMessage } from "@/lib/getApiErrorMessage";
import {
  useCreateDashboardPaymentMutation,
  useGetDashboardAccountsQuery,
  useGetDashboardCurrenciesQuery,
} from "@/features/school/api/accountingApi";
import { selectAccessToken, selectAuthReady } from "@/features/auth/authSlice";
import { useAppSelector } from "@/store/hooks";
import type { DashboardPayment } from "@/features/school/types";

const inputClass =
  "h-11 w-full rounded-xl border border-border bg-white px-3 text-sm text-foreground outline-none focus:border-primary";
type SourceRow = {
  key: string;
  accountId: string;
  amount: string;
  description: string;
};
const rowKey = () => crypto.randomUUID();
const emptyRow = (): SourceRow => ({
  key: rowKey(),
  accountId: "",
  amount: "",
  description: "",
});

export function PaymentForm() {
  const router = useRouter();
  const ready = useAppSelector(selectAuthReady);
  const token = useAppSelector(selectAccessToken);
  const canFetch = ready && Boolean(token);
  const [destinationId, setDestinationId] = useState("");
  const [currencyId, setCurrencyId] = useState("");
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");
  const [rows, setRows] = useState<SourceRow[]>([emptyRow()]);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<DashboardPayment | null>(null);
  const [idempotencyKey, setIdempotencyKey] = useState(rowKey);
  const { data: accounts = [], isLoading } = useGetDashboardAccountsQuery(
    undefined,
    { skip: !canFetch },
  );
  const { data: currencies = [] } = useGetDashboardCurrenciesQuery(undefined, {
    skip: !canFetch,
  });
  const [createPayment, mutation] = useCreateDashboardPaymentMutation();
  const sources = accounts.filter(
    (account) => account.type === "CASH" || account.type === "GENERAL",
  );
  const selectedCurrencyId = currencyId || String(currencies[0]?.id ?? "");
  const total = useMemo(
    () =>
      rows.reduce(
        (sum, row) => sum + (Number(row.amount) > 0 ? Number(row.amount) : 0),
        0,
      ),
    [rows],
  );

  function updateRow(key: string, patch: Partial<SourceRow>) {
    setRows((current) =>
      current.map((row) => (row.key === key ? { ...row, ...patch } : row)),
    );
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    const sourceIds = rows.map((row) => row.accountId);
    if (!destinationId || !selectedCurrencyId || sourceIds.some((id) => !id))
      return setError(
        "Complete the destination, currency, and every source row.",
      );
    if (new Set(sourceIds).size !== sourceIds.length)
      return setError("Each funding account can appear only once.");
    if (sourceIds.includes(destinationId))
      return setError("The destination cannot also fund the payment.");
    const allocations = rows.map((row) => ({
      accountId: Number(row.accountId),
      amount: Number(row.amount),
      description: row.description.trim() || undefined,
    }));
    if (
      allocations.some((row) => !Number.isFinite(row.amount) || row.amount <= 0)
    )
      return setError("Every amount must be greater than zero.");
    try {
      const payment = await createPayment({
        accountId: Number(destinationId),
        currencyId: Number(selectedCurrencyId),
        date: date || undefined,
        description: description.trim() || undefined,
        allocations,
        idempotencyKey,
      }).unwrap();
      setCreated(payment);
      setError(null);
    } catch (cause) {
      setError(getApiErrorMessage(cause, "Could not create payment"));
    }
  }

  if (!canFetch || isLoading) return <LoadingDots label="Loading accounts" />;

  return (
    <form
      onSubmit={submit}
      className="mx-auto max-w-4xl space-y-6 rounded-2xl border border-border bg-white p-6 shadow-sm"
    >
      <div>
        <h1 className="text-xl font-semibold">New payment</h1>
        <p className="mt-1 text-sm text-muted">
          Debit one destination and fund it from one or more Cash or General
          accounts.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <label className="text-sm font-medium">
          To Account *
          <select
            className={`${inputClass} mt-1.5`}
            value={destinationId}
            onChange={(event) => setDestinationId(event.target.value)}
          >
            <option value="">Select account</option>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.code} — {account.name} ({account.type})
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-medium">
          Currency *
          <select
            className={`${inputClass} mt-1.5`}
            value={selectedCurrencyId}
            onChange={(event) => setCurrencyId(event.target.value)}
          >
            {currencies.map((currency) => (
              <option key={currency.id} value={currency.id}>
                {currency.symbol} / {currency.shortCode}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-medium">
          Date
          <input
            className={`${inputClass} mt-1.5`}
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
          />
        </label>
      </div>
      <label className="block text-sm font-medium">
        Description
        <input
          className={`${inputClass} mt-1.5`}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
      </label>
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold">Payment sources</h2>
            <p className="text-sm text-muted">
              Cash and General accounts only.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setRows((current) => [...current, emptyRow()])}
            className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm"
          >
            <Plus className="h-4 w-4" /> Add row
          </button>
        </div>
        {rows.map((row, index) => (
          <div
            key={row.key}
            className="grid gap-3 rounded-xl border border-border bg-stone-50 p-3 md:grid-cols-[1.5fr_0.7fr_1fr_auto]"
          >
            <select
              aria-label={`Source account ${index + 1}`}
              className={inputClass}
              value={row.accountId}
              onChange={(event) =>
                updateRow(row.key, { accountId: event.target.value })
              }
            >
              <option value="">Source account</option>
              {sources.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.code} — {account.name}
                </option>
              ))}
            </select>
            <input
              aria-label={`Amount ${index + 1}`}
              className={inputClass}
              type="number"
              min="0.01"
              step="0.01"
              placeholder="Amount"
              value={row.amount}
              onChange={(event) =>
                updateRow(row.key, { amount: event.target.value })
              }
            />
            <input
              aria-label={`Description ${index + 1}`}
              className={inputClass}
              placeholder="Description"
              value={row.description}
              onChange={(event) =>
                updateRow(row.key, { description: event.target.value })
              }
            />
            <button
              aria-label={`Remove source ${index + 1}`}
              type="button"
              disabled={rows.length === 1}
              onClick={() =>
                setRows((current) =>
                  current.filter((candidate) => candidate.key !== row.key),
                )
              }
              className="rounded-lg border border-border p-3 disabled:opacity-40"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </section>
      <div className="flex justify-end text-lg font-semibold">
        Total: {total.toFixed(2)}{" "}
        {
          currencies.find(
            (currency) => String(currency.id) === selectedCurrencyId,
          )?.shortCode
        }
      </div>
      {error ? (
        <p
          role="alert"
          className="rounded-xl bg-red-50 p-3 text-sm text-red-700"
        >
          {error}
        </p>
      ) : null}
      {created ? (
        <p
          role="status"
          className="flex items-center gap-2 rounded-xl bg-green-50 p-3 text-sm text-green-800"
        >
          <CheckCircle2 className="h-4 w-4" /> Payment #{created.nb} posted for{" "}
          {created.total}.
        </p>
      ) : null}
      <div className="flex flex-wrap gap-3">
        <button
          disabled={mutation.isLoading}
          className="rounded-lg bg-primary px-5 py-3 text-sm font-medium text-on-primary"
        >
          {mutation.isLoading ? "Posting…" : "Post payment"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/accounting/payments")}
          className="rounded-lg border border-border px-5 py-3 text-sm"
        >
          Cancel
        </button>
        {created ? (
          <button
            type="button"
            onClick={() => {
              setRows([emptyRow()]);
              setCreated(null);
              setIdempotencyKey(rowKey());
            }}
            className="rounded-lg border border-border px-5 py-3 text-sm"
          >
            Create another
          </button>
        ) : null}
      </div>
    </form>
  );
}
