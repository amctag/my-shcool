"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { ChevronDown, Pencil, PiggyBank, Plus, Trash2 } from "lucide-react";
import { getApiErrorMessage } from "@/lib/getApiErrorMessage";
import {
  accountingApi,
  useCreateDashboardAccountMutation,
  useDeleteDashboardAccountMutation,
  useGetDashboardAccountChildrenQuery,
  useGetDashboardAccountNextCodeQuery,
  useGetDashboardRootAccountsQuery,
  useUpdateDashboardAccountMutation,
} from "@/features/school/api/accountingApi";
import { selectAuthReady, selectAccessToken } from "@/features/auth/authSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import type { DashboardAccount } from "@/features/school/types";

const cardClass =
  "overflow-hidden rounded-2xl border border-border bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)]";

const inputClass =
  "h-11 w-full rounded-xl border border-border bg-white px-3 text-sm text-foreground outline-none transition-colors duration-200 placeholder:text-muted/80 focus:border-primary disabled:cursor-not-allowed disabled:opacity-60";

const primaryButtonClass =
  "inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-on-primary hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60";

const ghostButtonClass =
  "inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-lg border border-border bg-white px-4 text-sm font-medium text-foreground hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-60";

function TypeBadge({ account }: { account: DashboardAccount }) {
  const tone = account.isGroup
    ? "bg-violet-100 text-violet-800"
    : account.type === "PERSON"
      ? "bg-sky-100 text-sky-800"
      : account.type === "CASH"
        ? "bg-green-100 text-green-800"
        : account.type === "SALES"
          ? "bg-amber-100 text-amber-800"
          : account.type === "PURCHASES"
            ? "bg-purple-100 text-purple-800"
            : "bg-stone-200 text-stone-700";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${tone}`}
    >
      <PiggyBank aria-hidden className="h-3 w-3" />
      {account.isGroup ? "GROUP" : account.type}
    </span>
  );
}

function TreeSkeleton() {
  return (
    <div className="space-y-2 p-5" aria-label="Loading chart of accounts">
      {[0, 1, 2, 3].map((row) => (
        <div
          key={row}
          className="h-11 animate-pulse rounded-xl bg-stone-100"
          style={{ marginLeft: row % 2 === 0 ? 0 : 24 }}
        />
      ))}
    </div>
  );
}

function DetailsPanel({
  account,
  onChanged,
  onDeleted,
}: {
  account: DashboardAccount;
  onChanged: (parentId: number | null) => void;
  onDeleted: (parentId: number | null) => void;
}) {
  const ready = useAppSelector(selectAuthReady);
  const accessToken = useAppSelector(selectAccessToken);
  const canFetch = ready && Boolean(accessToken);
  const [mode, setMode] = useState<"details" | "addChild" | "addRoot">(
    "details",
  );
  const [rename, setRename] = useState(account.name);
  const [groupChecked, setGroupChecked] = useState(account.isGroup);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formNotice, setFormNotice] = useState<string | null>(null);

  const [updateAccount, { isLoading: isUpdating }] =
    useUpdateDashboardAccountMutation();
  const [deleteAccount, { isLoading: isDeleting }] =
    useDeleteDashboardAccountMutation();

  function resetFor(next: DashboardAccount) {
    setRename(next.name);
    setGroupChecked(next.isGroup);
    setConfirmDelete(false);
    setFormError(null);
    setFormNotice(null);
    setMode("details");
  }

  const isProtected = account.protected;

  async function onSaveDetails(event: FormEvent) {
    event.preventDefault();
    if (isProtected) return;
    const trimmed = rename.trim();
    if (!trimmed) {
      setFormError("Account name is required.");
      return;
    }
    setFormError(null);
    setFormNotice(null);
    try {
      await updateAccount({
        id: account.id,
        body: { name: trimmed, isGroup: groupChecked },
      }).unwrap();
      setFormNotice("Account updated.");
      onChanged(account.parentId);
    } catch (error) {
      setFormError(getApiErrorMessage(error, "Could not update account"));
    }
  }

  async function onDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setFormError(null);
    try {
      await deleteAccount(account.id).unwrap();
      onDeleted(account.parentId);
    } catch (error) {
      setFormError(getApiErrorMessage(error, "Could not delete account"));
      setConfirmDelete(false);
    }
  }

  return (
    <div className="space-y-5 p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            Selected account
          </p>
          <h2 className="mt-1 truncate text-xl font-semibold tabular-nums text-foreground">
            {account.code}
          </h2>
          <p dir="auto" className="mt-0.5 truncate text-sm text-muted">
            {account.name}
          </p>
        </div>
        <TypeBadge account={account} />
      </div>

      <dl className="grid gap-3 rounded-2xl border border-border bg-stone-50/60 p-4 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-xs uppercase tracking-wide text-muted">Code</dt>
          <dd className="mt-0.5 font-semibold tabular-nums text-foreground">
            {account.code}
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-muted">Type</dt>
          <dd className="mt-0.5 font-medium text-foreground">{account.type}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-muted">
            Designation
          </dt>
          <dd className="mt-0.5 font-medium text-foreground">
            {account.isGroup ? "Group (no postings)" : "Posting account"}
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-muted">
            Linked person
          </dt>
          <dd className="mt-0.5 font-medium text-foreground">
            {account.relatedPerson?.fullName || "—"}
          </dd>
        </div>
      </dl>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => {
            resetFor(account);
            setMode("addChild");
          }}
          disabled={!account.isGroup}
          title={
            account.isGroup
              ? "Add a child account"
              : "Only group accounts can have children"
          }
          className={primaryButtonClass}
        >
          <Plus aria-hidden className="h-4 w-4" /> Add Child
        </button>
        <button
          type="button"
          onClick={() => {
            resetFor(account);
            setMode("addRoot");
          }}
          className={ghostButtonClass}
        >
          <Plus aria-hidden className="h-4 w-4" /> Add Root Account
        </button>
        <Link
          href="/accounting/statement"
          className={ghostButtonClass}
        >
          Statement
        </Link>
      </div>

      {mode === "addChild" ? (
        <AddChildForm
          key={`child-${account.id}`}
          parent={account}
          canFetch={canFetch}
          onDone={(parentId) => {
            setMode("details");
            onChanged(parentId);
          }}
          onCancel={() => setMode("details")}
        />
      ) : null}
      {mode === "addRoot" ? (
        <AddRootForm
          key="root"
          canFetch={canFetch}
          onDone={() => {
            setMode("details");
            onChanged(null);
          }}
          onCancel={() => setMode("details")}
        />
      ) : null}

      <form onSubmit={onSaveDetails} className="space-y-4 border-t border-border pt-5">
        <h3 className="text-sm font-semibold text-foreground">Edit account</h3>
        {isProtected ? (
          <p
            className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
            role="note"
          >
            System accounts (Person, Cash, Sales, Purchases) cannot be edited
            manually.
          </p>
        ) : null}
        <label className="block" htmlFor="chart-account-name">
          <span className="mb-1.5 block text-sm font-medium text-foreground">
            Account name *
          </span>
          <input
            id="chart-account-name"
            value={rename}
            onChange={(event) => setRename(event.target.value)}
            maxLength={255}
            disabled={isProtected || isUpdating}
            className={inputClass}
          />
        </label>
        <label className="flex cursor-pointer items-start gap-3 text-sm">
          <input
            type="checkbox"
            checked={groupChecked}
            onChange={(event) => setGroupChecked(event.target.checked)}
            disabled={isProtected || isUpdating}
            className="mt-1 h-4 w-4 accent-[#f1612d]"
          />
          <span>
            <span className="font-medium text-foreground">Group account</span>
            <span className="block text-xs text-muted">
              Group accounts organize the chart and cannot receive journal
              postings. A group with children cannot become a posting account.
            </span>
          </span>
        </label>
        <p className="text-xs text-muted">
          The account code is immutable: renaming never rewrites descendant
          codes.
        </p>
        {formError ? (
          <p className="text-sm text-red-600" role="alert">
            {formError}
          </p>
        ) : null}
        {formNotice ? (
          <p className="text-sm text-green-700" role="status">
            {formNotice}
          </p>
        ) : null}
        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={isProtected || isUpdating}
            className={primaryButtonClass}
          >
            <Pencil aria-hidden className="h-4 w-4" />
            {isUpdating ? "Saving…" : "Save changes"}
          </button>
          {!isProtected ? (
            <button
              type="button"
              onClick={onDelete}
              disabled={isDeleting}
              className={`inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-lg border px-4 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-60 ${
                confirmDelete
                  ? "border-red-300 bg-red-600 text-white hover:bg-red-700"
                  : "border-red-200 bg-white text-red-700 hover:bg-red-50"
              }`}
            >
              <Trash2 aria-hidden className="h-4 w-4" />
              {isDeleting
                ? "Deleting…"
                : confirmDelete
                  ? "Confirm delete"
                  : "Delete"}
            </button>
          ) : null}
        </div>
        {confirmDelete ? (
          <p className="text-xs text-muted">
            Deletion is blocked while the account has children or is referenced
            by journal entries, documents, or a person.
          </p>
        ) : null}
      </form>
    </div>
  );
}

function AddChildForm({
  parent,
  canFetch,
  onDone,
  onCancel,
}: {
  parent: DashboardAccount;
  canFetch: boolean;
  onDone: (parentId: number) => void;
  onCancel: () => void;
}) {
  const isCustomerBranch = parent.code === "4111";
  const { data: preview, isLoading: previewLoading } =
    useGetDashboardAccountNextCodeQuery(parent.id, { skip: !canFetch });
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [type, setType] = useState<"GENERAL" | "PERSON">(
    isCustomerBranch ? "PERSON" : "GENERAL",
  );
  const [isGroup, setIsGroup] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createAccount, { isLoading }] = useCreateDashboardAccountMutation();

  const autoAllocatable = preview?.autoAllocatable === true;
  const expectedCode = preview?.expectedCode ?? null;
  const requiredLength = preview?.requiredLength ?? null;
  const childrenAllowed =
    !preview || previewLoading || requiredLength !== null;

  // Prefill with the backend suggestion until the user types their own code.
  const effectiveCode = code !== "" ? code : (expectedCode ?? "");

  function validateCode(raw: string): string | null {
    const trimmed = raw.trim();
    if (!trimmed) {
      return "An account code is required. Use the suggested code or enter a valid one.";
    }
    if (!/^\d+$/.test(trimmed)) {
      return "Account code must contain only numeric digits.";
    }
    if (requiredLength !== null) {
      if (
        trimmed.length !== requiredLength ||
        !trimmed.startsWith(parent.code)
      ) {
        return `Account code must be exactly ${requiredLength} digits starting with "${parent.code}".`;
      }
    } else if (!trimmed.startsWith(parent.code)) {
      return `Account code must start with the parent code "${parent.code}".`;
    }
    return null;
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Account name is required.");
      return;
    }
    if (!autoAllocatable) {
      const codeError = validateCode(effectiveCode);
      if (codeError) {
        setError(codeError);
        return;
      }
    }
    setError(null);
    try {
      await createAccount({
        name: trimmedName,
        type: isCustomerBranch ? "PERSON" : "GENERAL",
        parentId: parent.id,
        code: autoAllocatable ? undefined : effectiveCode.trim(),
        isGroup: isCustomerBranch ? false : isGroup,
      }).unwrap();
      onDone(parent.id);
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not create account"));
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-4 rounded-2xl border border-border bg-stone-50/60 p-4"
    >
      <h3 className="text-sm font-semibold text-foreground">
        Add child account
      </h3>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block" htmlFor="child-parent">
          <span className="mb-1.5 block text-sm font-medium text-foreground">
            Parent
          </span>
          <input
            id="child-parent"
            value={`${parent.code} / ${parent.name}`}
            readOnly
            disabled
            className={inputClass}
          />
        </label>
        <label className="block" htmlFor="child-expected-code">
          <span className="mb-1.5 block text-sm font-medium text-foreground">
            Suggested Code
          </span>
          <input
            id="child-expected-code"
            value={
              previewLoading
                ? "Calculating…"
                : (expectedCode ?? "Not available")
            }
            readOnly
            disabled
            className={`${inputClass} tabular-nums`}
          />
        </label>
      </div>
      {requiredLength !== null ? (
        <p className="text-xs text-muted" role="note">
          Required child format: {requiredLength} digits · Code must start
          with: <span className="font-semibold tabular-nums">{parent.code}</span>
        </p>
      ) : !previewLoading ? (
        <p className="text-xs text-red-600" role="alert">
          This account cannot have children (final posting level).
        </p>
      ) : null}
      <label className="block" htmlFor="child-name">
        <span className="mb-1.5 block text-sm font-medium text-foreground">
          Account Name *
        </span>
        <input
          id="child-name"
          dir="auto"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder={isCustomerBranch ? "Parent display name" : "Account name"}
          maxLength={255}
          className={inputClass}
        />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block" htmlFor="child-code">
          <span className="mb-1.5 block text-sm font-medium text-foreground">
            Account Code {!autoAllocatable ? "*" : ""}
          </span>
          <input
            id="child-code"
            value={autoAllocatable ? (expectedCode ?? "") : effectiveCode}
            onChange={(event) => setCode(event.target.value)}
            readOnly={autoAllocatable}
            disabled={autoAllocatable || isLoading}
            placeholder={
              autoAllocatable
                ? "Allocated by the backend"
                : requiredLength !== null
                  ? `Exactly ${requiredLength} digits starting with ${parent.code}`
                  : `Must extend ${parent.code}`
            }
            maxLength={255}
            className={`${inputClass} tabular-nums`}
          />
        </label>
        <label className="block" htmlFor="child-type">
          <span className="mb-1.5 block text-sm font-medium text-foreground">
            Type
          </span>
          <select
            id="child-type"
            value={type}
            onChange={(event) =>
              setType(event.target.value as "GENERAL" | "PERSON")
            }
            disabled={isLoading || isCustomerBranch}
            className={inputClass}
          >
            <option value="GENERAL">GENERAL</option>
            {isCustomerBranch ? (
              <option value="PERSON">PERSON</option>
            ) : null}
          </select>
        </label>
      </div>
      {!isCustomerBranch ? (
        <label className="flex cursor-pointer items-start gap-3 text-sm">
          <input
            type="checkbox"
            checked={isGroup}
            onChange={(event) => setIsGroup(event.target.checked)}
            className="mt-1 h-4 w-4 accent-[#f1612d]"
          />
          <span>
            <span className="font-medium text-foreground">Group account</span>
            <span className="block text-xs text-muted">
              Enable when this account will itself have children.
            </span>
          </span>
        </label>
      ) : (
        <p className="text-xs text-muted">
          PERSON leaves under 4111 are always posting accounts with an
          8-digit code allocated by the backend.
        </p>
      )}
      {error ? (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={isLoading || !childrenAllowed}
          className={primaryButtonClass}
        >
          {isLoading ? "Saving…" : "Save"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className={ghostButtonClass}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function AddRootForm({
  canFetch,
  onDone,
  onCancel,
}: {
  canFetch: boolean;
  onDone: () => void;
  onCancel: () => void;
}) {
  void canFetch;
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [isGroup, setIsGroup] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createAccount, { isLoading }] = useCreateDashboardAccountMutation();

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Account name is required.");
      return;
    }
    const trimmedCode = code.trim();
    if (!/^\d$/.test(trimmedCode)) {
      setError("Root account code is required: exactly one numeric digit (0-9).");
      return;
    }
    setError(null);
    try {
      await createAccount({
        name: trimmedName,
        type: "GENERAL",
        code: trimmedCode,
        isGroup,
      }).unwrap();
      onDone();
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not create account"));
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-4 rounded-2xl border border-border bg-stone-50/60 p-4"
    >
      <h3 className="text-sm font-semibold text-foreground">
        Add root account
      </h3>
      <label className="block" htmlFor="root-name">
        <span className="mb-1.5 block text-sm font-medium text-foreground">
          Account Name *
        </span>
        <input
          id="root-name"
          dir="auto"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="e.g. حسابات الطرف الثالث"
          maxLength={255}
          className={inputClass}
        />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block" htmlFor="root-code">
          <span className="mb-1.5 block text-sm font-medium text-foreground">
            Account Code *
          </span>
          <input
            id="root-code"
            value={code}
            onChange={(event) => setCode(event.target.value)}
            placeholder="e.g. 9 — exactly one digit"
            maxLength={1}
            inputMode="numeric"
            className={`${inputClass} tabular-nums`}
          />
          <span className="mt-1.5 block text-xs text-muted">
            Root codes are exactly one numeric digit (0–9).
          </span>
        </label>
        <label className="block" htmlFor="root-type">
          <span className="mb-1.5 block text-sm font-medium text-foreground">
            Type
          </span>
          <input
            id="root-type"
            value="GENERAL"
            readOnly
            disabled
            className={inputClass}
          />
        </label>
      </div>
      <label className="flex cursor-pointer items-start gap-3 text-sm">
        <input
          type="checkbox"
          checked={isGroup}
          onChange={(event) => setIsGroup(event.target.checked)}
          className="mt-1 h-4 w-4 accent-[#f1612d]"
        />
        <span>
          <span className="font-medium text-foreground">Group account</span>
          <span className="block text-xs text-muted">
            Root branches (e.g. 4) are usually group accounts.
          </span>
        </span>
      </label>
      {error ? (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <button type="submit" disabled={isLoading} className={primaryButtonClass}>
          {isLoading ? "Saving…" : "Save"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className={ghostButtonClass}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

export function ChartOfAccounts() {
  const ready = useAppSelector(selectAuthReady);
  const accessToken = useAppSelector(selectAccessToken);
  const canFetch = ready && Boolean(accessToken);
  const dispatch = useAppDispatch();
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [selected, setSelected] = useState<DashboardAccount | null>(null);
  const [showRootForm, setShowRootForm] = useState(false);
  const [mobileDetailsOpen, setMobileDetailsOpen] = useState(false);

  const {
    data: roots = [],
    error,
    isLoading,
    refetch,
  } = useGetDashboardRootAccountsQuery(undefined, { skip: !canFetch });

  function toggleExpand(id: number) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function handleSelect(account: DashboardAccount) {
    setSelected(account);
    setShowRootForm(false);
    setMobileDetailsOpen(true);
  }

  function refreshAfterChange(parentId: number | null) {
    dispatch(
      accountingApi.util.invalidateTags([
        { type: "DashboardAccounting", id: "ACCOUNT-ROOTS" },
        { type: "DashboardAccounting", id: "ACCOUNTS" },
        ...(parentId
          ? [
              {
                type: "DashboardAccounting" as const,
                id: `account-children-${parentId}`,
              },
              {
                type: "DashboardAccounting" as const,
                id: `account-next-code-${parentId}`,
              },
            ]
          : []),
      ]),
    );
    void refetch();
  }

  function handleDeleted(parentId: number | null) {
    refreshAfterChange(parentId);
    setSelected(null);
    setMobileDetailsOpen(false);
  }

  if (isLoading || !canFetch) {
    return (
      <div className={cardClass}>
        <TreeSkeleton />
      </div>
    );
  }

  return (
    <>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <p className="text-sm text-muted">
          Expand a root to reveal its children. Select an account to view
          details or add a child. Person accounts are linked from the Parents
          page.
        </p>
        <button
          type="button"
          onClick={() => {
            setSelected(null);
            setShowRootForm((prev) => !prev);
            setMobileDetailsOpen(true);
          }}
          className="inline-flex h-11 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-on-primary hover:bg-primary-hover"
        >
          <Plus aria-hidden className="h-4 w-4" />
          Add Root Account
        </button>
      </div>

      {error ? (
        <p
          className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700"
          role="alert"
        >
          {getApiErrorMessage(error, "Could not load chart of accounts")}
        </p>
      ) : (
        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
          <div className={cardClass}>
            <div className="border-b border-border px-5 py-3">
              <h2 className="text-sm font-semibold text-foreground">
                Chart of Accounts
              </h2>
              <p className="text-xs text-muted">
                {roots.length === 0
                  ? "No root accounts yet"
                  : `${roots.length} root account${roots.length === 1 ? "" : "s"}`}
              </p>
            </div>
            {roots.length === 0 ? (
              <p className="px-6 py-10 text-center text-sm text-muted">
                No accounts yet. Create the first root account to start the
                chart.
              </p>
            ) : (
              <ul className="space-y-0.5 p-3" role="listbox" aria-label="Chart of accounts roots">
                {roots.map((root) => (
                  <ChartNode
                    key={root.id}
                    account={root}
                    selectedId={selected?.id ?? null}
                    expandedIds={expandedIds}
                    onToggle={toggleExpand}
                    onSelect={handleSelect}
                  />
                ))}
              </ul>
            )}
          </div>

          <div className={`${cardClass} ${mobileDetailsOpen ? "" : "hidden lg:block"}`}>
            {selected ? (
              <DetailsPanel
                key={selected.id}
                account={selected}
                onChanged={refreshAfterChange}
                onDeleted={handleDeleted}
              />
            ) : showRootForm ? (
              <div className="p-5 sm:p-6">
                <AddRootForm
                  canFetch={canFetch}
                  onDone={() => {
                    setShowRootForm(false);
                    refreshAfterChange(null);
                  }}
                  onCancel={() => setShowRootForm(false)}
                />
              </div>
            ) : (
              <div className="px-6 py-14 text-center">
                <p className="text-sm font-medium text-foreground">
                  Select an account
                </p>
                <p className="mx-auto mt-1 max-w-sm text-sm text-muted">
                  Choose an account in the tree to view its details, rename it,
                  or add a child account underneath it.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function ChartNode({
  account,
  selectedId,
  expandedIds,
  onToggle,
  onSelect,
}: {
  account: DashboardAccount;
  selectedId: number | null;
  expandedIds: Set<number>;
  onToggle: (id: number) => void;
  onSelect: (account: DashboardAccount) => void;
}) {
  const ready = useAppSelector(selectAuthReady);
  const accessToken = useAppSelector(selectAccessToken);
  const canFetch = ready && Boolean(accessToken);
  const expanded = expandedIds.has(account.id);
  const { data: children = [], isLoading, error } =
    useGetDashboardAccountChildrenQuery(account.id, {
      skip: !canFetch || !expanded,
    });
  const selected = selectedId === account.id;

  return (
    <li>
      <div
        role="option"
        tabIndex={0}
        onClick={() => onSelect(account)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onSelect(account);
          }
        }}
        aria-selected={selected}
        className={`flex w-full cursor-pointer items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm transition-colors duration-150 ${
          selected
            ? "bg-primary/10 ring-1 ring-inset ring-primary"
            : "hover:bg-stone-50"
        }`}
      >
        {account.hasChildren || expanded ? (
          <button
            type="button"
            aria-label={expanded ? `Collapse ${account.name}` : `Expand ${account.name}`}
            aria-expanded={expanded}
            onClick={(event) => {
              event.stopPropagation();
              onToggle(account.id);
            }}
            className="inline-flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-lg text-muted hover:bg-stone-200/70 hover:text-foreground"
          >
            <ChevronDown
              aria-hidden
              className={`h-4 w-4 transition-transform duration-150 ${expanded ? "" : "-rotate-90"}`}
            />
          </button>
        ) : (
          <span aria-hidden className="inline-block h-7 w-7 shrink-0" />
        )}
        <span className="min-w-0 flex-1">
          <span className="block truncate font-semibold tabular-nums text-foreground">
            {account.code}
          </span>
          <span dir="auto" className="block truncate text-muted">
            {account.name}
          </span>
        </span>
        {account.isGroup ? (
          <span className="hidden shrink-0 rounded-full bg-violet-100 px-2 py-0.5 text-[11px] font-medium text-violet-800 sm:inline">
            Group
          </span>
        ) : null}
      </div>
      {expanded ? (
        <div className="ml-5 border-l border-border pl-2">
          {isLoading ? (
            <div className="space-y-2 py-2" aria-label="Loading children">
              {[0, 1].map((row) => (
                <div
                  key={row}
                  className="h-10 animate-pulse rounded-xl bg-stone-100"
                />
              ))}
            </div>
          ) : error ? (
            <p className="px-3 py-2 text-xs text-red-600" role="alert">
              {getApiErrorMessage(error, "Could not load children")}
            </p>
          ) : children.length === 0 ? (
            <p className="px-3 py-2 text-xs text-muted">No child accounts.</p>
          ) : (
            <ul className="space-y-0.5 py-1" role="listbox" aria-label={`Children of ${account.code}`}>
              {children.map((child) => (
                <ChartNode
                  key={child.id}
                  account={child}
                  selectedId={selectedId}
                  expandedIds={expandedIds}
                  onToggle={onToggle}
                  onSelect={onSelect}
                />
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </li>
  );
}
