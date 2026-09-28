"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, MinusCircle, PlusCircle } from "lucide-react";
import { getApiErrorMessage } from "@/lib/getApiErrorMessage";
import { useGetParentOptionsQuery } from "@/features/school/api/parentsApi";
import {
  useCreateDashboardInvoiceMutation,
  useGetDashboardCurrenciesQuery,
  useGetDashboardItemsQuery,
  useGetDashboardParentRegistrationsQuery,
} from "@/features/school/api/accountingApi";
import { selectAuthReady } from "@/features/auth/authSlice";
import { useAppSelector } from "@/store/hooks";
import type {
  DashboardCurrency,
  DashboardInvoice,
  DashboardParentOption,
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

type InvoiceRow = {
  key: string;
  itemId: string;
  price: string;
  quantity: string;
  forRegistrationId: string;
  description: string;
};

function emptyRow(): InvoiceRow {
  return {
    key: newRowKey(),
    itemId: "",
    price: "",
    quantity: "1",
    forRegistrationId: "",
    description: "",
  };
}

function formatTotal(value: number, shortCode: string): string {
  const formatted = new Intl.NumberFormat("en", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
  return shortCode ? `Total: ${formatted} ${shortCode}` : `Total: ${formatted}`;
}

export function InvoiceForm() {
  const router = useRouter();
  const ready = useAppSelector(selectAuthReady);
  const [parentQuery, setParentQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [selectedParent, setSelectedParent] =
    useState<DashboardParentOption | null>(null);
  const [currencyId, setCurrencyId] = useState("");
  const [date, setDate] = useState("");
  const [rows, setRows] = useState<InvoiceRow[]>([emptyRow()]);
  const [description, setDescription] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [created, setCreated] = useState<DashboardInvoice | null>(null);
  const [idempotencyKey, setIdempotencyKey] = useState(newIdempotencyKey);
  const [createInvoice, { isLoading }] = useCreateDashboardInvoiceMutation();
  const boxRef = useRef<HTMLDivElement>(null);

  const { data: currencies = [] } = useGetDashboardCurrenciesQuery(undefined, {
    skip: !ready,
  });
  const { data: itemsData } = useGetDashboardItemsQuery(
    { page: 1, limit: 500 },
    { skip: !ready },
  );
  const items = useMemo(() => itemsData?.items ?? [], [itemsData]);
  const itemById = useMemo(
    () => new Map(items.map((item) => [String(item.id), item])),
    [items],
  );

  const { data: parentRegistrations = [] } =
    useGetDashboardParentRegistrationsQuery(selectedParent?.id ?? 0, {
      skip: !ready || !selectedParent,
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
      const price = Number(row.price);
      const quantity = Number(row.quantity || "1");
      if (
        Number.isFinite(price) &&
        price > 0 &&
        Number.isFinite(quantity) &&
        quantity > 0
      ) {
        sum += Math.round(price * quantity * 100) / 100;
      }
    }
    return Math.round(sum * 100) / 100;
  }, [rows]);

  const canSearch = ready && pickerOpen && debounced.trim().length >= 1;
  const { data: options = [], isFetching: isSearching } =
    useGetParentOptionsQuery(debounced.trim(), { skip: !canSearch });

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
    setRows([emptyRow()]);
  }

  function updateRow(key: string, patch: Partial<InvoiceRow>) {
    setRows((prev) => {
      const next = prev.map((row) =>
        row.key === key ? { ...row, ...patch } : row,
      );
      if (patch.itemId !== undefined) {
        const item = itemById.get(patch.itemId);
        return next.map((row) =>
          row.key === key && item
            ? { ...row, price: Number(item.price).toFixed(2) }
            : row,
        );
      }
      return next;
    });
  }

  function removeRow(key: string) {
    setRows((prev) =>
      prev.length > 1 ? prev.filter((row) => row.key !== key) : prev,
    );
  }

  function resetForm() {
    setSelectedParent(null);
    setParentQuery("");
    setCurrencyId("");
    setDate("");
    setRows([emptyRow()]);
    setDescription("");
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
    const details: Array<{
      itemId: number;
      unitPrice: number;
      quantity: number;
      forRegistrationId?: number;
      description?: string;
    }> = [];
    for (const [index, row] of rows.entries()) {
      if (!row.itemId) {
        setFormError(`Row ${index + 1}: choose an item.`);
        return;
      }
      const price = Number(row.price);
      if (!Number.isFinite(price) || price <= 0) {
        setFormError(`Row ${index + 1}: price must be greater than zero.`);
        return;
      }
      const quantity = Number(row.quantity || "1");
      if (!Number.isFinite(quantity) || quantity <= 0) {
        setFormError(`Row ${index + 1}: quantity must be greater than zero.`);
        return;
      }
      details.push({
        itemId: Number(row.itemId),
        unitPrice: Math.round(price * 100) / 100,
        quantity: Math.round(quantity * 1000) / 1000,
        forRegistrationId: row.forRegistrationId
          ? Number(row.forRegistrationId)
          : undefined,
        description: row.description.trim() || undefined,
      });
    }
    if (details.length === 0) {
      setFormError("Add at least one invoice row.");
      return;
    }
    setFormError(null);
    try {
      const invoice = await createInvoice({
        parentId: selectedParent.id,
        currencyId: selectedCurrency.id,
        date: date || undefined,
        details,
        description: description.trim() || undefined,
        idempotencyKey,
      }).unwrap();
      setCreated(invoice);
    } catch (error) {
      setFormError(getApiErrorMessage(error, "Could not create invoice"));
    }
  }

  const currencyShortCode = selectedCurrency?.shortCode ?? "";

  return (
    <form
      onSubmit={onSubmit}
      className="mx-auto max-w-2xl space-y-5 rounded-2xl border border-border bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)]"
    >
      <div>
        <h1 className="text-xl font-semibold text-foreground">New invoice</h1>
        <p className="mt-1 text-sm text-muted">
          Bill a parent manually. One parent debit and one sales credit are
          posted for the total. Optionally link each line to a student
          registration.
        </p>
      </div>

      <Field id="invoice-parent" label="Parent" required>
        <div ref={boxRef} className="relative">
          <input
            id="invoice-parent"
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={pickerOpen}
            aria-controls="invoice-parent-list"
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
              id="invoice-parent-list"
              role="listbox"
              className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-border bg-white py-1 shadow-[0_8px_30px_rgb(0,0,0,0.08)]"
            >
              {debounced.trim().length < 1 ? (
                <li className="px-3 py-3 text-sm text-muted">
                  Type a first, middle, or last name
                </li>
              ) : isSearching ? (
                <li className="px-3 py-3 text-sm text-muted">Searching…</li>
              ) : options.length === 0 ? (
                <li className="px-3 py-3 text-sm text-muted">
                  No parents match
                </li>
              ) : (
                options.map((parent) => (
                  <li
                    key={parent.id}
                    role="option"
                    aria-selected={selectedParent?.id === parent.id}
                  >
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
          <p
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            role="alert"
          >
            This parent has no accounting account. Create one from the Parents
            page first — invoices cannot create accounts.
          </p>
        )
      ) : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="invoice-currency" label="Currency" required>
          <select
            id="invoice-currency"
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
        <Field id="invoice-date" label="Date">
          <input
            id="invoice-date"
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            className={inputClass}
          />
        </Field>
      </div>

      <Field id="invoice-description" label="Description">
        <input
          id="invoice-description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="e.g. October fees"
          className={inputClass}
        />
      </Field>

      <fieldset>
        <legend className="mb-1.5 block text-sm font-medium text-foreground">
          Invoice items *
        </legend>
        <div className="space-y-3">
          {rows.map((row, index) => (
            <div
              key={row.key}
              className="grid gap-3 rounded-xl border border-border bg-stone-50/60 p-3"
            >
              <div className="grid gap-3 sm:grid-cols-[1fr_8rem_6rem]">
                <label className="block min-w-0">
                  <span className="mb-1 block text-xs font-medium text-muted">
                    Item
                  </span>
                  <select
                    aria-label={`Row ${index + 1} item`}
                    value={row.itemId}
                    onChange={(event) =>
                      updateRow(row.key, { itemId: event.target.value })
                    }
                    className={inputClass}
                  >
                    <option value="">Choose item</option>
                    {items.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name} — {Number(item.price).toFixed(2)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block min-w-0">
                  <span className="mb-1 block text-xs font-medium text-muted">
                    Price
                  </span>
                  <input
                    aria-label={`Row ${index + 1} price`}
                    type="number"
                    min="0"
                    step="0.01"
                    value={row.price}
                    onChange={(event) =>
                      updateRow(row.key, { price: event.target.value })
                    }
                    placeholder="0.00"
                    className={inputClass}
                  />
                </label>
                <label className="block min-w-0">
                  <span className="mb-1 block text-xs font-medium text-muted">
                    Qty
                  </span>
                  <input
                    aria-label={`Row ${index + 1} quantity`}
                    type="number"
                    min="0"
                    step="0.001"
                    value={row.quantity}
                    onChange={(event) =>
                      updateRow(row.key, { quantity: event.target.value })
                    }
                    placeholder="1"
                    className={inputClass}
                  />
                </label>
              </div>
              <div className="flex items-end gap-2">
                <label className="block min-w-0 flex-1">
                  <span className="mb-1 block text-xs font-medium text-muted">
                    For student / registration (optional)
                  </span>
                  <select
                    aria-label={`Row ${index + 1} registration`}
                    value={row.forRegistrationId}
                    onChange={(event) =>
                      updateRow(row.key, {
                        forRegistrationId: event.target.value,
                      })
                    }
                    className={inputClass}
                    disabled={!selectedParent}
                  >
                    <option value="">No registration</option>
                    {parentRegistrations.map((registration) => (
                      <option key={registration.id} value={registration.id}>
                        {registration.label}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  type="button"
                  onClick={() => removeRow(row.key)}
                  disabled={rows.length <= 1}
                  aria-label={`Remove row ${index + 1}`}
                  className="inline-flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-border bg-white text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <MinusCircle aria-hidden className="h-5 w-5" />
                </button>
              </div>
              <label className="block min-w-0">
                <span className="mb-1 block text-xs font-medium text-muted">
                  Line description (optional)
                </span>
                <textarea
                  aria-label={`Row ${index + 1} description`}
                  value={row.description}
                  onChange={(event) =>
                    updateRow(row.key, { description: event.target.value })
                  }
                  placeholder="e.g. School uniform pants - size 10"
                  rows={2}
                  className={`${inputClass} min-h-[3.5rem] resize-y py-2`}
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
            Add item
          </button>
          <p className="text-sm font-semibold text-foreground" role="status">
            {formatTotal(total, currencyShortCode)}
          </p>
        </div>
      </fieldset>

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
            Invoice #{created.nb} created
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
            Create another invoice
          </button>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-3 pt-1">
        <button
          type="submit"
          disabled={isLoading || !selectedParent || !selectedHasAccount}
          className="inline-flex h-11 cursor-pointer items-center justify-center rounded-lg bg-primary px-5 text-sm font-medium text-on-primary hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? "Saving…" : "Post invoice"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/accounting/invoices")}
          className="inline-flex h-11 cursor-pointer items-center justify-center rounded-lg border border-border bg-white px-5 text-sm font-medium text-foreground hover:bg-stone-50"
        >
          Back to invoices
        </button>
      </div>
    </form>
  );
}
