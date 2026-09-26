"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { getApiErrorMessage } from "@/lib/getApiErrorMessage";
import {
  useCreateDashboardAccountMutation,
  useUpdateDashboardAccountMutation,
} from "@/features/school/api/accountingApi";
import type { DashboardAccount } from "@/features/school/types";

const inputClass =
  "h-11 w-full rounded-xl border border-border bg-white px-3 text-sm text-foreground outline-none transition-colors duration-200 placeholder:text-muted/80 focus:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-60";

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

export function AccountForm({
  account,
}: {
  account?: DashboardAccount;
}) {
  const router = useRouter();
  const isEdit = Boolean(account);
  const isProtected = account?.protected === true;
  const [name, setName] = useState(account?.name ?? "");
  const [formError, setFormError] = useState<string | null>(null);
  const [created, setCreated] = useState<DashboardAccount | null>(null);
  const [createAccount, { isLoading: isCreating }] =
    useCreateDashboardAccountMutation();
  const [updateAccount, { isLoading: isUpdating }] =
    useUpdateDashboardAccountMutation();

  const isLoading = isCreating || isUpdating;

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (isProtected) {
      setFormError("System accounts cannot be edited manually.");
      return;
    }
    const trimmed = name.trim();
    if (!trimmed) {
      setFormError("Account name is required.");
      return;
    }
    setFormError(null);
    try {
      if (account) {
        const updated = await updateAccount({
          id: account.id,
          body: { name: trimmed },
        }).unwrap();
        setCreated(updated);
      } else {
        const next = await createAccount({
          name: trimmed,
          type: "GENERAL",
        }).unwrap();
        setCreated(next);
      }
    } catch (error) {
      setFormError(getApiErrorMessage(error, "Could not save account"));
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mx-auto max-w-2xl space-y-5 rounded-2xl border border-border bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)]"
    >
      <div>
        <h1 className="text-xl font-semibold text-foreground">
          {isEdit ? "Edit account" : "New account"}
        </h1>
        <p className="mt-1 text-sm text-muted">
          {isEdit
            ? "Only the name of a GENERAL account can be changed. The code and type are immutable."
            : "Create a bank or cash-box account. The account code is generated automatically."}
        </p>
      </div>

      {isEdit && account ? (
        <div className="grid gap-5 sm:grid-cols-2">
          <Field id="account-code" label="Account code">
            <input
              id="account-code"
              value={account.code}
              readOnly
              disabled
              className={inputClass}
            />
          </Field>
          <Field id="account-type" label="Account type">
            <input
              id="account-type"
              value={account.type}
              readOnly
              disabled
              className={inputClass}
            />
          </Field>
        </div>
      ) : null}

      {isProtected ? (
        <p
          className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
          role="alert"
        >
          This is a system account and cannot be edited manually.
        </p>
      ) : null}

      <Field id="account-name" label="Account name" required>
        <input
          id="account-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="e.g. Bank Audi"
          maxLength={255}
          disabled={isProtected}
          className={inputClass}
        />
      </Field>

      {!isEdit ? (
        <Field id="account-type-new" label="Account type" required>
          <select
            id="account-type-new"
            value="GENERAL"
            disabled
            aria-describedby="account-type-hint"
            className={inputClass}
          >
            <option value="GENERAL">GENERAL</option>
          </select>
          <span id="account-type-hint" className="mt-1.5 block text-xs text-muted">
            Only GENERAL accounts can be created here. Person, Cash, Sales, and
            Purchases accounts are managed by the system.
          </span>
        </Field>
      ) : null}

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
            {isEdit ? "Account updated" : "Account created"}
          </p>
          <p className="mt-1">
            Code: {created.code} · Name: {created.name} · Type: {created.type}
          </p>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-3 pt-1">
        <button
          type="submit"
          disabled={isLoading || isProtected}
          className="inline-flex h-11 cursor-pointer items-center justify-center rounded-lg bg-primary px-5 text-sm font-medium text-on-primary hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? "Saving…" : "Save"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/accounting/accounts")}
          className="inline-flex h-11 cursor-pointer items-center justify-center rounded-lg border border-border bg-white px-5 text-sm font-medium text-foreground hover:bg-stone-50"
        >
          {created ? "Back to accounts" : "Cancel"}
        </button>
      </div>
    </form>
  );
}
