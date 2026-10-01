"use client";

import { useEffect, useState } from "react";
import { Loader2, Plus, Wallet, X } from "lucide-react";
import { getApiErrorMessage } from "@/lib/getApiErrorMessage";
import { useCreateParentAccountingAccountMutation } from "@/features/school/api/parentsApi";

export function AccountingAccountDialog({
  accountCode,
  parentName,
  onClose,
}: {
  accountCode: string;
  parentName: string;
  onClose: () => void;
}) {
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
      <button
        type="button"
        aria-label="Close account information"
        className="absolute inset-0 cursor-pointer bg-black/40"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="account-information-title"
        className="relative z-10 w-full max-w-md rounded-3xl bg-surface p-6 shadow-xl sm:p-8"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              Accounting account
            </p>
            <h2
              id="account-information-title"
              className="mt-1 text-2xl font-semibold text-foreground"
            >
              {parentName}
            </h2>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="inline-flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full hover:bg-primary-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <X aria-hidden className="h-5 w-5" />
          </button>
        </div>
        <div className="mt-6 rounded-2xl border border-border bg-white p-5">
          <p className="text-sm text-muted">Account code</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">
            {accountCode}
          </p>
        </div>
      </div>
    </div>
  );
}

export function CreateAccountingAccountDialog({
  parentName,
  busy,
  error,
  onCancel,
  onConfirm,
}: {
  parentName: string;
  busy: boolean;
  error: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !busy) {
        onCancel();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [busy, onCancel]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
      <button
        type="button"
        aria-label="Close"
        disabled={busy}
        className="absolute inset-0 cursor-pointer bg-black/40 disabled:cursor-not-allowed"
        onClick={onCancel}
      />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="create-account-title"
        aria-describedby="create-account-description"
        className="relative z-10 w-full max-w-lg rounded-3xl bg-surface p-6 shadow-xl sm:p-8"
      >
        <h2
          id="create-account-title"
          className="text-2xl font-semibold text-foreground"
        >
          Create Accounting Account
        </h2>
        <dl
          id="create-account-description"
          className="mt-4 space-y-3 rounded-2xl border border-border bg-white p-5 text-sm"
        >
          <div className="flex flex-wrap justify-between gap-2">
            <dt className="text-muted">Parent</dt>
            <dd className="font-medium text-foreground">{parentName}</dd>
          </div>
          <div className="flex flex-wrap justify-between gap-2">
            <dt className="text-muted">Account type</dt>
            <dd className="font-medium text-foreground">PERSON</dd>
          </div>
          <div className="flex flex-wrap justify-between gap-2">
            <dt className="text-muted">Account code</dt>
            <dd className="font-medium text-foreground">
              Will be generated automatically
            </dd>
          </div>
        </dl>
        {error ? (
          <p className="mt-4 text-sm text-red-600" role="alert">
            {error}
          </p>
        ) : null}
        <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            disabled={busy}
            onClick={onCancel}
            className="inline-flex h-11 cursor-pointer items-center justify-center rounded-xl border border-border bg-white px-5 text-sm font-medium text-foreground transition-colors duration-200 hover:bg-primary-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onConfirm}
            className="inline-flex h-11 cursor-pointer items-center justify-center rounded-xl bg-primary px-5 text-sm font-medium text-on-primary transition-colors duration-200 hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? "Creating…" : "Create Account"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function ParentAccountAction({
  parentId,
  fullName,
  hasAccountingAccount,
  accountCode,
  canCreateAccountingAccount,
}: {
  parentId: number;
  fullName: string;
  hasAccountingAccount: boolean;
  accountCode: string | null;
  canCreateAccountingAccount?: boolean;
}) {
  const [createAccountingAccount, accountState] =
    useCreateParentAccountingAccountMutation();
  const [accountError, setAccountError] = useState<string | null>(null);
  const [pendingAccount, setPendingAccount] = useState(false);
  const [accountInformation, setAccountInformation] = useState<string | null>(
    null,
  );

  const cannotCreate =
    !hasAccountingAccount && canCreateAccountingAccount === false;

  async function confirmCreateAccountingAccount() {
    if (accountState.isLoading) {
      return;
    }
    setAccountError(null);
    try {
      const account = await createAccountingAccount(parentId).unwrap();
      setAccountInformation(account.accountCode);
      setPendingAccount(false);
    } catch (caught) {
      setAccountError(
        getApiErrorMessage(caught, "Could not create accounting account"),
      );
    }
  }

  return (
    <>
      {hasAccountingAccount && accountCode ? (
        <button
          type="button"
          onClick={() => setAccountInformation(accountCode)}
          aria-label={`View accounting account ${accountCode}`}
          title={`Account ${accountCode}`}
          className="inline-flex h-8 cursor-pointer items-center rounded-lg border border-border bg-white px-2.5 font-mono text-xs font-medium tabular-nums text-foreground transition-colors duration-200 hover:border-primary hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          {accountCode}
        </button>
      ) : (
        <button
          type="button"
          disabled={accountState.isLoading || cannotCreate}
          onClick={() => {
            setAccountError(null);
            setPendingAccount(true);
          }}
          aria-label={
            cannotCreate
              ? "Accounting account is managed by the parent's school"
              : "Create accounting account"
          }
          title={
            cannotCreate
              ? "Accounting account is managed by the parent's school"
              : "Create accounting account"
          }
          className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-border bg-white text-muted transition-colors duration-200 hover:border-primary hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50"
        >
          {accountState.isLoading ? (
            <Loader2 aria-hidden className="h-4 w-4 animate-spin" />
          ) : (
            <span aria-hidden className="relative inline-flex">
              <Wallet className="h-4 w-4" />
              <Plus className="absolute -right-1.5 -top-1.5 h-3 w-3 rounded-full bg-white" />
            </span>
          )}
        </button>
      )}
      {pendingAccount ? (
        <CreateAccountingAccountDialog
          parentName={fullName}
          busy={accountState.isLoading}
          error={accountError}
          onCancel={() => {
            if (!accountState.isLoading) {
              setPendingAccount(false);
              setAccountError(null);
            }
          }}
          onConfirm={() => void confirmCreateAccountingAccount()}
        />
      ) : null}
      {accountInformation ? (
        <AccountingAccountDialog
          parentName={fullName}
          accountCode={accountInformation}
          onClose={() => setAccountInformation(null)}
        />
      ) : null}
    </>
  );
}
