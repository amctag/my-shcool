"use client";

import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, MinusCircle, PlusCircle } from "lucide-react";
import { getApiErrorMessage } from "@/lib/getApiErrorMessage";
import {
  useCreateDashboardReceiptMutation,
  useGetDashboardCurrenciesQuery,
  useUpdateDashboardReceiptMutation,
} from "@/features/school/api/accountingApi";
import { selectAuthReady } from "@/features/auth/authSlice";
import { useAppSelector } from "@/store/hooks";
import type {
  DashboardCurrency,
  DashboardPostingLookup,
  DashboardReceipt,
} from "@/features/school/types";
import { PostingAccountSelect } from "@/features/school/components/PostingAccountSelect";

const inputClass =
  "h-11 w-full rounded-xl border border-border bg-white px-3 text-sm text-foreground outline-none transition-colors duration-200 placeholder:text-muted/80 focus:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

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

function newIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function newRowKey(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

type AllocationRow = {
  key: string;
  account: DashboardPostingLookup | null;
  amount: string;
  description: string;
};

function emptyRow(): AllocationRow {
  return { key: newRowKey(), account: null, amount: "", description: "" };
}

function formatTotal(value: number, shortCode: string): string {
  const formatted = new Intl.NumberFormat("en", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
  return shortCode ? `Total: ${formatted} ${shortCode}` : `Total: ${formatted}`;
}

export function ReceiptForm({ initial }: { initial?: DashboardReceipt }) {
  const router = useRouter();
  const ready = useAppSelector(selectAuthReady);
  const [toAccount, setToAccount] =
    useState<DashboardPostingLookup | null>(
      initial
        ? {
            id: initial.accountId,
            code: initial.accountCode,
            name: initial.parentName,
            personName: initial.parentName,
            parentId: initial.parentId,
          }
        : null,
    );
  const [currencyId, setCurrencyId] = useState(
    initial?.currencyId ? String(initial.currencyId) : "",
  );
  const [date, setDate] = useState(
    initial?.dateCreated.slice(0, 10) ?? todayLocal(),
  );
  const [rows, setRows] = useState<AllocationRow[]>(
    initial?.allocations.map((row) => ({
      key: newRowKey(),
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
  const [description, setDescription] = useState(initial?.description ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [internalComment, setInternalComment] = useState(
    initial?.comments ?? "",
  );
  const [formError, setFormError] = useState<string | null>(null);
  const [created, setCreated] = useState<DashboardReceipt | null>(null);
  const [idempotencyKey, setIdempotencyKey] = useState(newIdempotencyKey);
  const [createReceipt, { isLoading }] = useCreateDashboardReceiptMutation();
  const [updateReceipt, updateState] = useUpdateDashboardReceiptMutation();

  const { data: currencies = [] } = useGetDashboardCurrenciesQuery(undefined, {
    skip: !ready,
  });

  const selectedCurrency: DashboardCurrency | undefined = useMemo(() => {
    if (currencyId) {
      return currencies.find((c) => String(c.id) === currencyId);
    }
    return currencies[0];
  }, [currencies, currencyId]);

  const effectiveCurrencyId = selectedCurrency
    ? String(selectedCurrency.id)
    : "";

  const total = useMemo(() => {
    let sum = 0;
    for (const row of rows) {
      const parsed = Number(row.amount);
      if (Number.isFinite(parsed) && parsed > 0) {
        sum += Math.round(parsed * 100) / 100;
      }
    }
    return Math.round(sum * 100) / 100;
  }, [rows]);

  function updateRow(key: string, patch: Partial<AllocationRow>) {
    setRows((prev) =>
      prev.map((row) => (row.key === key ? { ...row, ...patch } : row)),
    );
  }

  function removeRow(key: string) {
    setRows((prev) =>
      prev.length > 1 ? prev.filter((row) => row.key !== key) : prev,
    );
  }

  function resetForm() {
    setToAccount(null);
    setCurrencyId("");
    setDate(todayLocal());
    setRows([emptyRow()]);
    setDescription("");
    setNotes("");
    setInternalComment("");
    setCreated(null);
    setFormError(null);
    setIdempotencyKey(newIdempotencyKey());
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!toAccount) {
      setFormError("Select a To account first.");
      return;
    }
    if (!selectedCurrency) {
      setFormError("Select a currency first.");
      return;
    }
    const seen = new Set<number>();
    const allocations: Array<{
      accountId: number;
      amount: number;
      description?: string;
    }> = [];
    for (const [index, row] of rows.entries()) {
      if (!row.account) {
        setFormError(
          `Allocation row ${index + 1}: choose a destination account.`,
        );
        return;
      }
      if (seen.has(row.account.id)) {
        setFormError(
          "Each destination account may appear only once per receipt.",
        );
        return;
      }
      seen.add(row.account.id);
      const parsed = Number(row.amount);
      if (!Number.isFinite(parsed) || parsed <= 0) {
        setFormError(
          `Allocation row ${index + 1}: amount must be greater than zero.`,
        );
        return;
      }
      allocations.push({
        accountId: row.account.id,
        amount: Math.round(parsed * 100) / 100,
        description: row.description.trim() || undefined,
      });
    }
    if (allocations.length === 0) {
      setFormError("Add at least one allocation row.");
      return;
    }
    setFormError(null);
    try {
      const body = {
        accountId: toAccount.id,
        currencyId: selectedCurrency.id,
        date: date || undefined,
        allocations,
        description: description.trim() || undefined,
        notes: notes.trim() || undefined,
        comments: internalComment.trim() || undefined,
        idempotencyKey: initial ? undefined : idempotencyKey,
      };
      const receipt = initial
        ? await updateReceipt({ id: initial.id, body }).unwrap()
        : await createReceipt(body).unwrap();
      setCreated(receipt);
      if (initial) router.push(`/accounting/receipts/${initial.id}`);
    } catch (error) {
      setFormError(getApiErrorMessage(error, "Could not create receipt"));
    }
  }

  const currencyShortCode = selectedCurrency?.shortCode ?? "";

  return (
    <form
      onSubmit={onSubmit}
      className="mx-auto w-full max-w-5xl space-y-6 rounded-2xl border border-border bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] sm:p-8"
    >
      <div>
        <h1 className="text-xl font-semibold text-foreground">
          {initial ? `Edit receipt #${initial.nb}` : "New receipt"}
        </h1>
        <p className="mt-1 text-sm text-muted">
          Receive money and split it across financial accounts. Destination
          account(s) are debited; the To account is credited for the total.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.7fr_1fr_1fr]">
        <Field id="receipt-to-account" label="To account" required>
          <PostingAccountSelect
            id="receipt-to-account"
            family="4"
            value={toAccount}
            onChange={(account) => {
              setToAccount(account);
              setFormError(null);
              setCreated(null);
            }}
            placeholder="Type person name or account code"
          />
        </Field>
        <Field id="receipt-currency" label="Currency" required>
          <select
            id="receipt-currency"
            value={effectiveCurrencyId}
            onChange={(event) => setCurrencyId(event.target.value)}
            className={inputClass}
          >
            {currencies.length === 0 ? (
              <option value="">Loading currencies…</option>
            ) : (
              currencies.map((currency) => (
                <option key={currency.id} value={currency.id}>
                  {currency.symbol} / {currency.shortCode}
                </option>
              ))
            )}
          </select>
        </Field>
        <Field id="receipt-date" label="Date">
          <input
            id="receipt-date"
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            className={inputClass}
          />
        </Field>
      </div>

      <Field id="receipt-description" label="Description">
        <input
          id="receipt-description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="e.g. Tuition installment"
          className={inputClass}
        />
      </Field>

      <fieldset>
        <legend className="mb-1.5 block text-sm font-medium text-foreground">
          Allocations *
        </legend>
        <div className="space-y-3">
          {rows.map((row, index) => (
            <div
              key={row.key}
              className="grid gap-3 rounded-xl border border-border bg-stone-50/60 p-3 lg:grid-cols-[1.6fr_10rem_1fr_auto]"
            >
              <div className="min-w-0">
                <span className="mb-1 block text-xs font-medium text-muted">
                  Destination account
                </span>
                <PostingAccountSelect
                  id={`receipt-destination-${row.key}`}
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
                  aria-label={`Allocation ${index + 1} amount`}
                  type="number"
                  min="0"
                  step="0.01"
                  value={row.amount}
                  onChange={(event) =>
                    updateRow(row.key, { amount: event.target.value })
                  }
                  placeholder="0.00"
                  className={inputClass}
                />
              </label>
              <div className="flex items-end gap-2">
                <label className="block min-w-0 flex-1">
                  <span className="mb-1 block text-xs font-medium text-muted">
                    Description
                  </span>
                  <input
                    aria-label={`Allocation ${index + 1} description`}
                    value={row.description}
                    onChange={(event) =>
                      updateRow(row.key, { description: event.target.value })
                    }
                    placeholder="Optional"
                    className={inputClass}
                  />
                </label>
                <button
                  type="button"
                  onClick={() => removeRow(row.key)}
                  disabled={rows.length <= 1}
                  aria-label={`Remove allocation row ${index + 1}`}
                  className="inline-flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-border bg-white text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <MinusCircle aria-hidden className="h-5 w-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setRows((prev) => [...prev, emptyRow()])}
            className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg border border-border bg-white px-4 text-sm font-medium text-foreground hover:bg-stone-50"
          >
            <PlusCircle aria-hidden className="h-4 w-4 text-primary" />
            Add row
          </button>
          <p className="text-sm font-semibold text-foreground" role="status">
            {formatTotal(total, currencyShortCode)}
          </p>
        </div>
      </fieldset>

      <Field id="receipt-notes" label="Notes">
        <textarea
          id="receipt-notes"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Optional notes"
          rows={3}
          className={`${inputClass} min-h-[5rem] resize-y py-3`}
        />
      </Field>

      <Field id="receipt-internal-comment" label="Internal comment">
        <textarea
          id="receipt-internal-comment"
          value={internalComment}
          onChange={(event) => setInternalComment(event.target.value)}
          placeholder="Optional internal comment — never shown on customer documents"
          rows={3}
          className={`${inputClass} min-h-[5rem] resize-y py-3`}
        />
      </Field>

      {formError ? (
        <p className="text-sm text-red-600" role="alert">
          {formError}
        </p>
      ) : null}

      {created && !initial ? (
        <div
          className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800"
          role="status"
        >
          <p className="flex items-center gap-2 font-medium">
            <CheckCircle2 aria-hidden className="h-4 w-4" />
            Receipt #{created.nb} created
          </p>
          <p className="mt-1">
            {created.parentName} · Account {created.accountCode} ·{" "}
            {created.currency
              ? `${created.currency.symbol} ${Number(created.total).toFixed(2)} ${created.currency.shortCode}`
              : Number(created.total).toFixed(2)}
          </p>
          <button
            type="button"
            onClick={resetForm}
            className="mt-2 cursor-pointer font-medium underline underline-offset-2"
          >
            Create another receipt
          </button>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-3 pt-1">
        <button
          type="submit"
          disabled={isLoading || updateState.isLoading || !toAccount}
          className="inline-flex h-11 cursor-pointer items-center justify-center rounded-lg bg-primary px-5 text-sm font-medium text-on-primary hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading || updateState.isLoading ? "Saving…" : "Save"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/accounting/receipts")}
          className="inline-flex h-11 cursor-pointer items-center justify-center rounded-lg border border-border bg-white px-5 text-sm font-medium text-foreground hover:bg-stone-50"
        >
          Back
        </button>
      </div>
    </form>
  );
}
