"use client";

import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Plus, Trash2 } from "lucide-react";
import { LoadingDots } from "@/components/dashboard/TableLoading";
import { getApiErrorMessage } from "@/lib/getApiErrorMessage";
import {
  useCreateDashboardPaymentMutation,
  useGetDashboardCurrenciesQuery,
  useUpdateDashboardPaymentMutation,
} from "@/features/school/api/accountingApi";
import { selectAccessToken, selectAuthReady } from "@/features/auth/authSlice";
import { useAppSelector } from "@/store/hooks";
import type {
  DashboardPayment,
  DashboardPostingLookup,
} from "@/features/school/types";
import { PostingAccountSelect } from "@/features/school/components/PostingAccountSelect";

const inputClass =
  "h-11 w-full rounded-xl border border-border bg-white px-3 text-sm text-foreground outline-none focus:border-primary";

function Field({
  id,
  label,
  required,
  children,
  className,
}: {
  id: string;
  label: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label htmlFor={id} className={`block min-w-0 ${className ?? ""}`}>
      <span className="mb-1.5 block text-sm font-medium text-foreground">
        {label}
        {required ? " *" : ""}
      </span>
      {children}
    </label>
  );
}

function todayLocal(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

type SourceRow = {
  key: string;
  account: DashboardPostingLookup | null;
  amount: string;
  description: string;
};
const rowKey = () => crypto.randomUUID();
const emptyRow = (): SourceRow => ({
  key: rowKey(),
  account: null,
  amount: "",
  description: "",
});

export function PaymentForm({ initial }: { initial?: DashboardPayment }) {
  const router = useRouter();
  const ready = useAppSelector(selectAuthReady);
  const token = useAppSelector(selectAccessToken);
  const canFetch = ready && Boolean(token);
  const [destination, setDestination] =
    useState<DashboardPostingLookup | null>(
      initial
        ? {
            id: initial.accountId,
            code: initial.accountCode,
            name: initial.accountName,
            personName: null,
            parentId: null,
          }
        : null,
    );
  const [currencyId, setCurrencyId] = useState(
    initial?.currencyId ? String(initial.currencyId) : "",
  );
  const [date, setDate] = useState(
    initial?.dateCreated.slice(0, 10) ?? todayLocal(),
  );
  const [description, setDescription] = useState(initial?.description ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [internalComment, setInternalComment] = useState(
    initial?.comments ?? "",
  );
  const [rows, setRows] = useState<SourceRow[]>(
    initial?.allocations.map((row) => ({
      key: rowKey(),
      account: {
        id: row.accountId,
        code: row.accountCode,
        name: row.accountName,
        personName: null,
        parentId: null,
      },
      amount: row.amount,
      description: row.description ?? "",
    })) ?? [emptyRow()],
  );
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<DashboardPayment | null>(null);
  const [idempotencyKey, setIdempotencyKey] = useState(rowKey);
  const { data: currencies = [], isLoading: currenciesLoading } =
    useGetDashboardCurrenciesQuery(undefined, {
      skip: !canFetch,
    });
  const [createPayment, mutation] = useCreateDashboardPaymentMutation();
  const [updatePayment, updateState] = useUpdateDashboardPaymentMutation();
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
    const sourceIds = rows.map((row) => row.account?.id ?? null);
    if (!destination || !selectedCurrencyId || sourceIds.some((id) => !id))
      return setError(
        "Complete the destination, currency, and every source row.",
      );
    if (new Set(sourceIds).size !== sourceIds.length)
      return setError("Each funding account can appear only once.");
    if (sourceIds.includes(destination.id))
      return setError("The destination cannot also fund the payment.");
    const allocations = rows.map((row) => ({
      accountId: Number(row.account?.id),
      amount: Number(row.amount),
      description: row.description.trim() || undefined,
    }));
    if (
      allocations.some((row) => !Number.isFinite(row.amount) || row.amount <= 0)
    )
      return setError("Every amount must be greater than zero.");
    try {
      const body = {
        accountId: destination.id,
        currencyId: Number(selectedCurrencyId),
        date: date || undefined,
        description: description.trim() || undefined,
        notes: notes.trim() || undefined,
        comments: internalComment.trim() || undefined,
        allocations,
        idempotencyKey: initial ? undefined : idempotencyKey,
      };
      const payment = initial
        ? await updatePayment({ id: initial.id, body }).unwrap()
        : await createPayment(body).unwrap();
      setCreated(payment);
      if (initial) router.push(`/accounting/payments/${initial.id}`);
      setError(null);
    } catch (cause) {
      setError(getApiErrorMessage(cause, "Could not create payment"));
    }
  }

  if (!canFetch || currenciesLoading)
    return <LoadingDots label="Loading accounts" />;

  return (
    <form
      onSubmit={submit}
      className="mx-auto w-full max-w-5xl space-y-6 rounded-2xl border border-border bg-white p-6 shadow-sm sm:p-8"
    >
      <div>
        <h1 className="text-xl font-semibold">
          {initial ? `Edit payment #${initial.nb}` : "New payment"}
        </h1>
        <p className="mt-1 text-sm text-muted">
          Debit the To account and fund it from one or more financial accounts.
          One destination debit and funding credits are posted for the total.
        </p>
      </div>
      <div className="grid gap-5 lg:grid-cols-[1.7fr_1fr_1fr]">
        <Field id="payment-to-account" label="To account" required>
          <PostingAccountSelect
            id="payment-to-account"
            family="4"
            value={destination}
            onChange={setDestination}
            placeholder="Type entity name or account code"
          />
        </Field>
        <Field id="payment-currency" label="Currency" required>
          <select
            id="payment-currency"
            className={`${inputClass} mt-0`}
            value={selectedCurrencyId}
            onChange={(event) => setCurrencyId(event.target.value)}
          >
            {currencies.map((currency) => (
              <option key={currency.id} value={currency.id}>
                {currency.symbol} / {currency.shortCode}
              </option>
            ))}
          </select>
        </Field>
        <Field id="payment-date" label="Date">
          <input
            id="payment-date"
            className={inputClass}
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
          />
        </Field>
      </div>
      <Field id="payment-description" label="Description">
        <input
          id="payment-description"
          className={inputClass}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="e.g. Supplier settlement"
        />
      </Field>
      <div className="grid gap-5 md:grid-cols-2">
        <Field id="payment-notes" label="Notes">
          <textarea
            id="payment-notes"
            className={`${inputClass} min-h-[5rem] resize-y py-3`}
            value={notes}
            rows={3}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Optional notes"
          />
        </Field>
        <Field id="payment-internal-comment" label="Internal comment">
          <textarea
            id="payment-internal-comment"
            className={`${inputClass} min-h-[5rem] resize-y py-3`}
            value={internalComment}
            rows={3}
            onChange={(event) => setInternalComment(event.target.value)}
            placeholder="Optional internal comment — never shown on customer documents"
          />
        </Field>
      </div>
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold">Payment sources</h2>
            <p className="text-sm text-muted">Financial accounts only.</p>
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
            className="grid gap-3 rounded-xl border border-border bg-stone-50 p-3 lg:grid-cols-[1.6fr_10rem_1fr_auto]"
          >
            <div className="min-w-0">
              <span className="mb-1 block text-xs font-medium text-muted">
                Source account
              </span>
              <PostingAccountSelect
                id={`payment-source-${row.key}`}
                family="5"
                value={row.account}
                onChange={(account) => updateRow(row.key, { account })}
                placeholder="Type account name or code"
              />
            </div>
            <label className="block min-w-0">
              <span className="mb-1 block text-xs font-medium text-muted">
                Amount
              </span>
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
            </label>
            <div className="flex items-end gap-2">
              <label className="block min-w-0 flex-1">
                <span className="mb-1 block text-xs font-medium text-muted">
                  Description
                </span>
                <input
                  aria-label={`Description ${index + 1}`}
                  className={inputClass}
                  placeholder="Description"
                  value={row.description}
                  onChange={(event) =>
                    updateRow(row.key, { description: event.target.value })
                  }
                />
              </label>
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
          disabled={mutation.isLoading || updateState.isLoading}
          className="rounded-lg bg-primary px-5 py-3 text-sm font-medium text-on-primary"
        >
          {mutation.isLoading || updateState.isLoading ? "Saving…" : "Save"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/accounting/payments")}
          className="rounded-lg border border-border px-5 py-3 text-sm"
        >
          Back
        </button>
        {created && !initial ? (
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
