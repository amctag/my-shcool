"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, MinusCircle, PlusCircle, Search } from "lucide-react";
import { getApiErrorMessage } from "@/lib/getApiErrorMessage";
import {
  useCreateDashboardRecordMutation,
  useGetDashboardAccountsPageQuery,
  useGetDashboardCurrenciesQuery,
} from "@/features/school/api/accountingApi";
import { selectAuthReady } from "@/features/auth/authSlice";
import { useAppSelector } from "@/store/hooks";
import type {
  DashboardAccount,
  DashboardCurrency,
  DashboardRecord,
} from "@/features/school/types";

const inputClass =
  "h-11 w-full rounded-xl border border-border bg-white px-3 text-sm text-foreground outline-none transition-colors duration-200 placeholder:text-muted/80 focus:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

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

type RecordRow = {
  key: string;
  account: DashboardAccount | null;
  query: string;
  debit: string;
  credit: string;
  description: string;
};

function emptyRow(): RecordRow {
  return {
    key: newRowKey(),
    account: null,
    query: "",
    debit: "",
    credit: "",
    description: "",
  };
}

function AccountCell({
  row,
  onPick,
}: {
  row: RecordRow;
  onPick: (account: DashboardAccount | null, label: string) => void;
}) {
  const ready = useAppSelector(selectAuthReady);
  const [open, setOpen] = useState(false);
  const [debounced, setDebounced] = useState("");
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(row.query.trim()), 250);
    return () => window.clearTimeout(timer);
  }, [row.query]);

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

  return (
    <div ref={boxRef} className="relative min-w-0">
      <Search className="absolute left-3 top-3.5 h-4 w-4 text-muted" />
      <input
        aria-label="Row account"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={open}
        aria-controls="record-account-list"
        autoComplete="off"
        value={row.query}
        placeholder="Code, name, or parent"
        onFocus={() => setOpen(true)}
        onChange={(event) => {
          onPick(null, event.target.value);
          setOpen(true);
        }}
        className={`${inputClass} pl-10`}
      />
      {open ? (
        <ul
          id="record-account-list"
          role="listbox"
          className="absolute z-20 mt-1 max-h-60 w-72 overflow-auto rounded-xl border border-border bg-white py-1 shadow-lg"
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
                  onClick={() => {
                    onPick(
                      account,
                      `${account.code} — ${account.name} — ${account.type}`,
                    );
                    setOpen(false);
                  }}
                  className="flex w-full cursor-pointer flex-col gap-0.5 px-3 py-2 text-left text-sm hover:bg-stone-50"
                >
                  <span className="font-medium text-foreground">
                    {account.code} — {account.name}
                  </span>
                  <span className="text-xs text-muted">{account.type}</span>
                </button>
              </li>
            ))
          )}
        </ul>
      ) : null}
    </div>
  );
}

function formatMoney(value: number): string {
  return new Intl.NumberFormat("en", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function RecordForm() {
  const router = useRouter();
  const ready = useAppSelector(selectAuthReady);
  const [currencyId, setCurrencyId] = useState("");
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [rows, setRows] = useState<RecordRow[]>([emptyRow(), emptyRow()]);
  const [formError, setFormError] = useState<string | null>(null);
  const [created, setCreated] = useState<DashboardRecord | null>(null);
  const [idempotencyKey, setIdempotencyKey] = useState(newIdempotencyKey);
  const [createRecord, { isLoading }] = useCreateDashboardRecordMutation();

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

  const totals = useMemo(() => {
    let debit = 0;
    let credit = 0;
    for (const row of rows) {
      const d = Number(row.debit || "0");
      const c = Number(row.credit || "0");
      if (Number.isFinite(d) && d > 0) {
        debit += Math.round(d * 100) / 100;
      }
      if (Number.isFinite(c) && c > 0) {
        credit += Math.round(c * 100) / 100;
      }
    }
    debit = Math.round(debit * 100) / 100;
    credit = Math.round(credit * 100) / 100;
    return { debit, credit, difference: Math.round((debit - credit) * 100) / 100 };
  }, [rows]);
  const balanced =
    totals.debit > 0 && totals.difference === 0 && rows.length >= 2;

  function updateRow(key: string, patch: Partial<RecordRow>) {
    setRows((prev) =>
      prev.map((row) => (row.key === key ? { ...row, ...patch } : row)),
    );
  }

  function removeRow(key: string) {
    setRows((prev) =>
      prev.length > 2 ? prev.filter((row) => row.key !== key) : prev,
    );
  }

  function resetForm() {
    setCurrencyId("");
    setDate("");
    setDescription("");
    setNotes("");
    setRows([emptyRow(), emptyRow()]);
    setCreated(null);
    setFormError(null);
    setIdempotencyKey(newIdempotencyKey());
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!selectedCurrency) {
      setFormError("Select a currency first.");
      return;
    }
    if (rows.length < 2) {
      setFormError("A record needs at least two journal rows.");
      return;
    }
    const postings: Array<{
      accountId: number;
      debit?: number;
      credit?: number;
      description?: string;
    }> = [];
    for (const [index, row] of rows.entries()) {
      if (!row.account) {
        setFormError(`Row ${index + 1}: choose an account.`);
        return;
      }
      const debit = Number(row.debit || "0");
      const credit = Number(row.credit || "0");
      const hasDebit = Number.isFinite(debit) && debit > 0;
      const hasCredit = Number.isFinite(credit) && credit > 0;
      if (hasDebit && hasCredit) {
        setFormError(
          `Row ${index + 1}: enter either a debit or a credit, not both.`,
        );
        return;
      }
      if (!hasDebit && !hasCredit) {
        setFormError(
          `Row ${index + 1}: enter a positive debit or credit amount.`,
        );
        return;
      }
      postings.push({
        accountId: row.account.id,
        debit: hasDebit ? Math.round(debit * 100) / 100 : undefined,
        credit: hasCredit ? Math.round(credit * 100) / 100 : undefined,
        description: row.description.trim() || undefined,
      });
    }
    const totalDebit = postings.reduce((sum, row) => sum + (row.debit ?? 0), 0);
    const totalCredit = postings.reduce(
      (sum, row) => sum + (row.credit ?? 0),
      0,
    );
    if (
      totalDebit <= 0 ||
      Math.round((totalDebit - totalCredit) * 100) !== 0
    ) {
      setFormError(
        "Record is out of balance: total debit must equal total credit.",
      );
      return;
    }
    setFormError(null);
    try {
      const record = await createRecord({
        currencyId: selectedCurrency.id,
        date: date || undefined,
        description: description.trim() || undefined,
        notes: notes.trim() || undefined,
        rows: postings,
        idempotencyKey,
      }).unwrap();
      setCreated(record);
    } catch (error) {
      setFormError(getApiErrorMessage(error, "Could not post record"));
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mx-auto max-w-3xl space-y-5 rounded-2xl border border-border bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)]"
    >
      <div>
        <h1 className="text-xl font-semibold text-foreground">New record</h1>
        <p className="mt-1 text-sm text-muted">
          Post a manual balanced journal entry. Debit and credit totals must
          match exactly.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block min-w-0" htmlFor="record-currency">
          <span className="mb-1.5 block text-sm font-medium text-foreground">
            Currency *
          </span>
          <select
            id="record-currency"
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
        </label>
        <label className="block min-w-0" htmlFor="record-date">
          <span className="mb-1.5 block text-sm font-medium text-foreground">
            Date
          </span>
          <input
            id="record-date"
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            className={inputClass}
          />
        </label>
      </div>

      <label className="block min-w-0" htmlFor="record-description">
        <span className="mb-1.5 block text-sm font-medium text-foreground">
          Description
        </span>
        <input
          id="record-description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="e.g. Year-end accrual"
          className={inputClass}
        />
      </label>

      <fieldset>
        <legend className="mb-1.5 block text-sm font-medium text-foreground">
          Journal rows *
        </legend>
        <div className="space-y-3">
          {rows.map((row, index) => (
            <div
              key={row.key}
              className="grid gap-3 rounded-xl border border-border bg-stone-50/60 p-3"
            >
              <AccountCell
                row={row}
                onPick={(account, label) =>
                  updateRow(row.key, { account, query: label })
                }
              />
              <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
                <label className="block min-w-0">
                  <span className="mb-1 block text-xs font-medium text-muted">
                    Debit
                  </span>
                  <input
                    aria-label={`Row ${index + 1} debit`}
                    type="number"
                    min="0"
                    step="0.01"
                    value={row.debit}
                    onChange={(event) =>
                      updateRow(row.key, {
                        debit: event.target.value,
                        credit:
                          event.target.value && Number(event.target.value) > 0
                            ? ""
                            : row.credit,
                      })
                    }
                    placeholder="0.00"
                    className={inputClass}
                  />
                </label>
                <label className="block min-w-0">
                  <span className="mb-1 block text-xs font-medium text-muted">
                    Credit
                  </span>
                  <input
                    aria-label={`Row ${index + 1} credit`}
                    type="number"
                    min="0"
                    step="0.01"
                    value={row.credit}
                    onChange={(event) =>
                      updateRow(row.key, {
                        credit: event.target.value,
                        debit:
                          event.target.value && Number(event.target.value) > 0
                            ? ""
                            : row.debit,
                      })
                    }
                    placeholder="0.00"
                    className={inputClass}
                  />
                </label>
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={() => removeRow(row.key)}
                    disabled={rows.length <= 2}
                    aria-label={`Remove row ${index + 1}`}
                    className="inline-flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-border bg-white text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <MinusCircle aria-hidden className="h-5 w-5" />
                  </button>
                </div>
              </div>
              <label className="block min-w-0">
                <span className="mb-1 block text-xs font-medium text-muted">
                  Row description (optional)
                </span>
                <input
                  aria-label={`Row ${index + 1} description`}
                  value={row.description}
                  onChange={(event) =>
                    updateRow(row.key, { description: event.target.value })
                  }
                  placeholder="Optional"
                  className={inputClass}
                />
              </label>
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
          <div className="text-sm tabular-nums" role="status">
            <p>
              Total debit:{" "}
              <span className="font-semibold">{formatMoney(totals.debit)}</span>
            </p>
            <p>
              Total credit:{" "}
              <span className="font-semibold">{formatMoney(totals.credit)}</span>
            </p>
            <p
              className={
                totals.difference === 0 && totals.debit > 0
                  ? "font-semibold text-green-700"
                  : "font-semibold text-red-600"
              }
            >
              Difference: {formatMoney(totals.difference)}{" "}
              {balanced ? "Balanced ✓" : ""}
            </p>
          </div>
        </div>
      </fieldset>

      <label className="block min-w-0" htmlFor="record-notes">
        <span className="mb-1.5 block text-sm font-medium text-foreground">
          Notes
        </span>
        <textarea
          id="record-notes"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Optional notes"
          rows={3}
          className={`${inputClass} min-h-[5rem] resize-y py-3`}
        />
      </label>

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
            Record #{created.nb} posted
          </p>
          <button
            type="button"
            onClick={resetForm}
            className="mt-2 cursor-pointer font-medium underline underline-offset-2"
          >
            Post another record
          </button>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-3 pt-1">
        <button
          type="submit"
          disabled={isLoading || !balanced}
          className="inline-flex h-11 cursor-pointer items-center justify-center rounded-lg bg-primary px-5 text-sm font-medium text-on-primary hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? "Posting…" : "Post record"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/accounting/records")}
          className="inline-flex h-11 cursor-pointer items-center justify-center rounded-lg border border-border bg-white px-5 text-sm font-medium text-foreground hover:bg-stone-50"
        >
          Back to records
        </button>
      </div>
    </form>
  );
}
