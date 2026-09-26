"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { getApiErrorMessage } from "@/lib/getApiErrorMessage";
import { useGetParentOptionsQuery } from "@/features/school/api/parentsApi";
import { useCreateDashboardReceiptMutation } from "@/features/school/api/accountingApi";
import { selectAuthReady } from "@/features/auth/authSlice";
import { useAppSelector } from "@/store/hooks";
import type { DashboardParentOption, DashboardReceipt } from "@/features/school/types";

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

export function ReceiptForm() {
  const router = useRouter();
  const ready = useAppSelector(selectAuthReady);
  const [parentQuery, setParentQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [selectedParent, setSelectedParent] = useState<DashboardParentOption | null>(null);
  const [amount, setAmount] = useState("");
  const [currencyId, setCurrencyId] = useState("");
  const [currencyRate, setCurrencyRate] = useState("");
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [comments, setComments] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [created, setCreated] = useState<DashboardReceipt | null>(null);
  const [idempotencyKey, setIdempotencyKey] = useState(newIdempotencyKey);
  const [createReceipt, { isLoading }] = useCreateDashboardReceiptMutation();
  const boxRef = useRef<HTMLDivElement>(null);

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
    setParentQuery(parent.fullName);
    setPickerOpen(false);
    setFormError(null);
    setCreated(null);
  }

  function resetForm() {
    setSelectedParent(null);
    setParentQuery("");
    setAmount("");
    setCurrencyId("");
    setCurrencyRate("");
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
    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setFormError("Amount must be greater than zero.");
      return;
    }
    setFormError(null);
    try {
      const receipt = await createReceipt({
        parentId: selectedParent.id,
        amount: Math.round(parsedAmount * 100) / 100,
        currencyId: currencyId.trim() ? Number(currencyId) : undefined,
        currencyRate: currencyRate.trim() ? Number(currencyRate) : undefined,
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

  return (
    <form
      onSubmit={onSubmit}
      className="mx-auto max-w-2xl space-y-5 rounded-2xl border border-border bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)]"
    >
      <div>
        <h1 className="text-xl font-semibold text-foreground">New receipt</h1>
        <p className="mt-1 text-sm text-muted">
          Receive money from a parent. Cash is debited and the parent account
          is credited.
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
                        {parent.fullName}
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
        <Field id="receipt-amount" label="Amount" required>
          <input
            id="receipt-amount"
            type="number"
            min="0"
            step="0.01"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            placeholder="e.g. 150.00"
            className={inputClass}
          />
        </Field>
        <Field id="receipt-currency" label="Currency ID">
          <input
            id="receipt-currency"
            type="number"
            min="1"
            step="1"
            value={currencyId}
            onChange={(event) => setCurrencyId(event.target.value)}
            placeholder="Optional"
            className={inputClass}
          />
        </Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="receipt-rate" label="Currency rate">
          <input
            id="receipt-rate"
            type="number"
            min="0"
            step="0.000001"
            value={currencyRate}
            onChange={(event) => setCurrencyRate(event.target.value)}
            placeholder="Optional"
            className={inputClass}
          />
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
            {created.parentName} · Account {created.accountCode} · $
            {Number(created.amount).toFixed(2)}
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
