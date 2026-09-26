"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, MinusCircle, PlusCircle } from "lucide-react";
import { getApiErrorMessage } from "@/lib/getApiErrorMessage";
import { useGetParentOptionsQuery } from "@/features/school/api/parentsApi";
import {
  useCreateDashboardReceiptMutation,
  useGetDashboardAccountsQuery,
  useGetDashboardCurrenciesQuery,
} from "@/features/school/api/accountingApi";
import { selectAuthReady } from "@/features/auth/authSlice";
import { useAppSelector } from "@/store/hooks";
import type {
  DashboardCurrency,
  DashboardParentOption,
  DashboardReceipt,
} from "@/features/school/types";

const inputClass =
  "h-11 w-full rounded-xl border border-border bg-white px-3 text-sm text-foreground outline-none transition-colors duration-200 placeholder:text-muted/80 focus:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

function Field({
  id,
  label,
  required,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <label htmlFor={id} className="block min-w-0">
      <span className="mb-1.5 block text-sm font-medium text-foreground">
        {label}
        {required ? " *" : ""}
      </span>
      {children}
    </label>
  );
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
  accountId: string;
  amount: string;
  description: string;
};

function emptyRow(): AllocationRow {
  return { key: newRowKey(), accountId: "", amount: "", description: "" };
}

function formatTotal(value: number, shortCode: string): string {
  const formatted = new Intl.NumberFormat("en", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
  return shortCode ? `Total: ${formatted} ${shortCode}` : `Total: ${formatted}`;
}

export function ReceiptForm() {
  const router = useRouter();
  const ready = useAppSelector(selectAuthReady);
  const [parentQuery, setParentQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [selectedParent, setSelectedParent] = useState<DashboardParentOption | null>(null);
  const [currencyId, setCurrencyId] = useState("");
  const [rows, setRows] = useState<AllocationRow[]>([emptyRow()]);
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [comments, setComments] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [created, setCreated] = useState<DashboardReceipt | null>(null);
  const [idempotencyKey, setIdempotencyKey] = useState(newIdempotencyKey);
  const [createReceipt, { isLoading }] = useCreateDashboardReceiptMutation();
  const boxRef = useRef<HTMLDivElement>(null);

  const { data: currencies = [] } = useGetDashboardCurrenciesQuery(undefined, {
    skip: !ready,
  });
  const { data: accounts = [] } = useGetDashboardAccountsQuery(undefined, {
    skip: !ready,
  });

  const destinations = useMemo(
    () => accounts.filter((a) => a.type === "CASH" || a.type === "GENERAL"),
    [accounts],
  );

  const selectedCurrency: DashboardCurrency | undefined = useMemo(() => {
    if (currencyId) {
      return currencies.find((c) => String(c.id) === currencyId);
    }
    return currencies[0];
  }, [currencies, currencyId]);

  const effectiveCurrencyId = selectedCurrency ? String(selectedCurrency.id) : "";

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

  const canSearch = ready && pickerOpen && debounced.trim().length >= 1;
  const { data: options = [], isFetching: isSearching } = useGetParentOptionsQuery(
    debounced.trim(),
    { skip: !canSearch },
  );

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(parentQuery), 250);
    return () => window.clearTimeout(timer);
  }, [parentQuery]);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!boxRef.current?.contains(event.target as Node)) {
        setPickerOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  const selectedHasAccount = selectedParent?.hasAccountingAccount === true;

  function pick(parent: DashboardParentOption) {
    setSelectedParent(parent);
    setParentQuery(
      parent.accountCode
        ? `${parent.fullName} — Account ${parent.accountCode}`
        : parent.fullName,
    );
    setPickerOpen(false);
    setFormError(null);
    setCreated(null);
  }

  function updateRow(key: string, patch: Partial<AllocationRow>) {
    setRows((prev) => prev.map((row) => (row.key === key ? { ...row, ...patch } : row)));
  }

  function removeRow(key: string) {
    setRows((prev) => (prev.length > 1 ? prev.filter((row) => row.key !== key) : prev));
  }

  function resetForm() {
    setSelectedParent(null);
    setParentQuery("");
    setCurrencyId("");
    setRows([emptyRow()]);
    setDescription("");
    setNotes("");
    setComments("");
    setCreated(null);
    setFormError(null);
    setIdempotencyKey(newIdempotencyKey());
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!selectedParent) {
      setFormError("Select a parent first.");
      return;
    }
    if (!selectedHasAccount) {
      setFormError(
        "This parent has no accounting account. Create one from the Parents page first.",
      );
      return;
    }
    if (!selectedCurrency) {
      setFormError("Select a currency first.");
      return;
    }
    const seen = new Set<string>();
    const allocations: Array<{ accountId: number; amount: number; description?: string }> = [];
    for (const [index, row] of rows.entries()) {
      if (!row.accountId) {
        setFormError(`Allocation row ${index + 1}: choose a destination account.`);
        return;
      }
      if (seen.has(row.accountId)) {
        setFormError("Each destination account may appear only once per receipt.");
        return;
      }
      seen.add(row.accountId);
      const parsed = Number(row.amount);
      if (!Number.isFinite(parsed) || parsed <= 0) {
        setFormError(`Allocation row ${index + 1}: amount must be greater than zero.`);
        return;
      }
      allocations.push({
        accountId: Number(row.accountId),
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
      const receipt = await createReceipt({
        parentId: selectedParent.id,
        currencyId: selectedCurrency.id,
        allocations,
        description: description.trim() || undefined,
        notes: notes.trim() || undefined,
        comments: comments.trim() || undefined,
        idempotencyKey,
      }).unwrap();
      setCreated(receipt);
    } catch (error) {
      setFormError(getApiErrorMessage(error, "Could not create receipt"));
    }
  }

  const matches = useMemo(() => options, [options]);
  const currencyShortCode = selectedCurrency?.shortCode ?? "";

  return (
    <form
      onSubmit={onSubmit}
      className="mx-auto max-w-2xl space-y-5 rounded-2xl border border-border bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)]"
    >
      <div>
        <h1 className="text-xl font-semibold text-foreground">New receipt</h1>
        <p className="mt-1 text-sm text-muted">
          Receive money from a parent and split it across cash and bank
          accounts. One parent credit is posted for the total.
        </p>
      </div>

      <Field id="receipt-parent" label="Parent" required>
        <div ref={boxRef} className="relative">
          <input
            id="receipt-parent"
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={pickerOpen}
            aria-controls="receipt-parent-list"
            autoComplete="off"
            value={parentQuery}
            placeholder="Type parent first, middle, or last name"
            onFocus={() => setPickerOpen(true)}
            onChange={(event) => {
              setParentQuery(event.target.value);
              setPickerOpen(true);
              setSelectedParent(null);
              setCreated(null);
            }}
            className={inputClass}
          />
          {pickerOpen ? (
            <ul
              id="receipt-parent-list"
              role="listbox"
              className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-border bg-white py-1 shadow-[0_8px_30px_rgb(0,0,0,0.08)]"
            >
              {debounced.trim().length < 1 ? (
                <li className="px-3 py-3 text-sm text-muted">
                  Type a first, middle, or last name
                </li>
              ) : isSearching ? (
                <li className="px-3 py-3 text-sm text-muted">Searching…</li>
              ) : matches.length === 0 ? (
                <li className="px-3 py-3 text-sm text-muted">No parents match</li>
              ) : (
                matches.map((parent) => (
                  <li key={parent.id} role="option" aria-selected={selectedParent?.id === parent.id}>
                    <button
                      type="button"
                      onClick={() => pick(parent)}
                      className="flex w-full cursor-pointer flex-col gap-0.5 px-3 py-2 text-left hover:bg-stone-50"
                    >
                      <span className="text-sm font-medium text-foreground">
                        {parent.accountCode
                          ? `${parent.fullName} — Account ${parent.accountCode}`
                          : parent.fullName}
                      </span>
                      <span
                        className={`text-xs ${parent.hasAccountingAccount ? "text-green-700" : "text-stone-500"}`}
                      >
                        {parent.hasAccountingAccount
                          ? `Account ${parent.accountCode}`
                          : "No accounting account"}
                      </span>
                    </button>
                  </li>
                ))
              )}
            </ul>
          ) : null}
        </div>
      </Field>

      {selectedParent ? (
        selectedHasAccount ? (
          <p className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
            {selectedParent.fullName} · Account {selectedParent.accountCode}
          </p>
        ) : (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
            This parent has no accounting account. Create one from the Parents
            page first — receipts cannot create accounts.
          </p>
        )
      ) : null}

      <div className="grid gap-5 sm:grid-cols-2">
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
        <Field id="receipt-description" label="Description">
          <input
            id="receipt-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="e.g. Tuition installment"
            className={inputClass}
          />
        </Field>
      </div>

      <fieldset>
        <legend className="mb-1.5 block text-sm font-medium text-foreground">
          Allocations *
        </legend>
        <div className="space-y-3">
          {rows.map((row, index) => (
            <div
              key={row.key}
              className="grid gap-3 rounded-xl border border-border bg-stone-50/60 p-3 sm:grid-cols-[1fr_9rem_auto]"
            >
              <label className="block min-w-0">
                <span className="mb-1 block text-xs font-medium text-muted">
                  Destination account
                </span>
                <select
                  aria-label={`Allocation ${index + 1} destination account`}
                  value={row.accountId}
                  onChange={(event) =>
                    updateRow(row.key, { accountId: event.target.value })
                  }
                  className={inputClass}
                >
                  <option value="">Choose account</option>
                  {destinations.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.code} — {account.name}
                    </option>
                  ))}
                </select>
              </label>
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

      <Field id="receipt-comments" label="Comments">
        <textarea
          id="receipt-comments"
          value={comments}
          onChange={(event) => setComments(event.target.value)}
          placeholder="Optional comments"
          rows={3}
          className={`${inputClass} min-h-[5rem] resize-y py-3`}
        />
      </Field>

      {formError ? (
        <p className="text-sm text-red-600" role="alert">
          {formError}
        </p>
      ) : null}

      {created ? (
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
          disabled={isLoading || !selectedParent || !selectedHasAccount}
          className="inline-flex h-11 cursor-pointer items-center justify-center rounded-lg bg-primary px-5 text-sm font-medium text-on-primary hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? "Posting…" : "Post receipt"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/accounting/receipts")}
          className="inline-flex h-11 cursor-pointer items-center justify-center rounded-lg border border-border bg-white px-5 text-sm font-medium text-foreground hover:bg-stone-50"
        >
          Back to receipts
        </button>
      </div>
    </form>
  );
}
