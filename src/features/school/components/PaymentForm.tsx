"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { LoadingDots } from "@/components/dashboard/TableLoading";
import { getApiErrorMessage } from "@/lib/getApiErrorMessage";
import {
  useGetDashboardAccountsQuery,
  useSetupDashboardSystemAccountsMutation,
  useCreateDashboardPaymentMutation,
} from "@/features/school/api/accountingApi";
import { selectAuthReady, selectAccessToken } from "@/features/auth/authSlice";
import { useAppSelector } from "@/store/hooks";
import type { DashboardPayment } from "@/features/school/types";

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

export function PaymentForm() {
  const router = useRouter();
  const ready = useAppSelector(selectAuthReady);
  const accessToken = useAppSelector(selectAccessToken);
  const canFetch = ready && Boolean(accessToken);
  const [accountId, setAccountId] = useState("");
  const [amount, setAmount] = useState("");
  const [currencyId, setCurrencyId] = useState("");
  const [currencyRate, setCurrencyRate] = useState("");
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [comments, setComments] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [created, setCreated] = useState<DashboardPayment | null>(null);
  const [idempotencyKey, setIdempotencyKey] = useState(newIdempotencyKey);
  const [createPayment, { isLoading }] = useCreateDashboardPaymentMutation();
  const [setupSystemAccounts, { isLoading: isSettingUp }] =
    useSetupDashboardSystemAccountsMutation();

  const {
    data: accounts = [],
    isLoading: isLoadingAccounts,
    error: accountsError,
    refetch,
  } = useGetDashboardAccountsQuery(undefined, { skip: !canFetch });

  useEffect(() => {
    if (!canFetch || isLoadingAccounts || accountsError) {
      return;
    }
    if (accounts.some((account) => account.type === "CASH")) {
      return;
    }
    setupSystemAccounts()
      .unwrap()
      .then(() => refetch())
      .catch(() => undefined);
  }, [canFetch, isLoadingAccounts, accountsError, accounts, setupSystemAccounts, refetch]);

  const destinations = accounts.filter((account) => account.type !== "CASH");
  const cashAccount = accounts.find((account) => account.type === "CASH");

  function resetForm() {
    setAccountId("");
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
    if (!accountId) {
      setFormError("Select a destination account first.");
      return;
    }
    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setFormError("Amount must be greater than zero.");
      return;
    }
    setFormError(null);
    try {
      const payment = await createPayment({
        accountId: Number(accountId),
        amount: Math.round(parsedAmount * 100) / 100,
        currencyId: currencyId.trim() ? Number(currencyId) : undefined,
        currencyRate: currencyRate.trim() ? Number(currencyRate) : undefined,
        description: description.trim() || undefined,
        notes: notes.trim() || undefined,
        comments: comments.trim() || undefined,
        idempotencyKey,
      }).unwrap();
      setCreated(payment);
    } catch (error) {
      setFormError(getApiErrorMessage(error, "Could not create payment"));
    }
  }

  if (!canFetch || isLoadingAccounts) {
    return <LoadingDots label="Loading accounts" />;
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mx-auto max-w-2xl space-y-5 rounded-2xl border border-border bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)]"
    >
      <div>
        <h1 className="text-xl font-semibold text-foreground">New payment</h1>
        <p className="mt-1 text-sm text-muted">
          Pay from the school Cash account against the selected destination
          account.
        </p>
      </div>

      {accountsError ? (
        <p className="text-sm text-red-600" role="alert">
          {getApiErrorMessage(accountsError, "Could not load accounts")}
        </p>
      ) : null}

      {cashAccount ? (
        <p className="rounded-xl border border-border bg-stone-50 px-4 py-3 text-sm text-muted">
          Paid from Cash · Account {cashAccount.code}
        </p>
      ) : (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {isSettingUp
            ? "Setting up school system accounts…"
            : "No Cash account yet — it will be created automatically when you post."}
        </p>
      )}

      <Field id="payment-account" label="Destination account" required>
        <select
          id="payment-account"
          value={accountId}
          onChange={(event) => {
            setAccountId(event.target.value);
            setCreated(null);
            setFormError(null);
          }}
          className={inputClass}
        >
          <option value="">Select an account</option>
          {destinations.map((account) => (
            <option key={account.id} value={account.id}>
              {account.name} · {account.code} ({account.type})
            </option>
          ))}
        </select>
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="payment-amount" label="Amount" required>
          <input
            id="payment-amount"
            type="number"
            min="0"
            step="0.01"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            placeholder="e.g. 75.50"
            className={inputClass}
          />
        </Field>
        <Field id="payment-currency" label="Currency ID">
          <input
            id="payment-currency"
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
        <Field id="payment-rate" label="Currency rate">
          <input
            id="payment-rate"
            type="number"
            min="0"
            step="0.000001"
            value={currencyRate}
            onChange={(event) => setCurrencyRate(event.target.value)}
            placeholder="Optional"
            className={inputClass}
          />
        </Field>
        <Field id="payment-description" label="Description">
          <input
            id="payment-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="e.g. Office supplies"
            className={inputClass}
          />
        </Field>
      </div>

      <Field id="payment-notes" label="Notes">
        <textarea
          id="payment-notes"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Optional notes"
          rows={3}
          className={`${inputClass} min-h-[5rem] resize-y py-3`}
        />
      </Field>

      <Field id="payment-comments" label="Comments">
        <textarea
          id="payment-comments"
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
            Payment #{created.nb} created
          </p>
          <p className="mt-1">
            {created.accountName} · Account {created.accountCode} · $
            {Number(created.amount).toFixed(2)}
          </p>
          <button
            type="button"
            onClick={resetForm}
            className="mt-2 cursor-pointer font-medium underline underline-offset-2"
          >
            Create another payment
          </button>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-3 pt-1">
        <button
          type="submit"
          disabled={isLoading || !accountId}
          className="inline-flex h-11 cursor-pointer items-center justify-center rounded-lg bg-primary px-5 text-sm font-medium text-on-primary hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? "Posting…" : "Post payment"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/accounting/payments")}
          className="inline-flex h-11 cursor-pointer items-center justify-center rounded-lg border border-border bg-white px-5 text-sm font-medium text-foreground hover:bg-stone-50"
        >
          Back to payments
        </button>
      </div>
    </form>
  );
}
