"use client";

import { useEffect, useState } from "react";
import { KeyRound, X } from "lucide-react";
import { getApiErrorMessage } from "@/lib/getApiErrorMessage";

const inputClass =
  "h-11 w-full rounded-xl border border-border bg-white px-3 text-sm text-foreground outline-none transition-colors duration-200 placeholder:text-muted/80 focus:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

export function ResetPasswordDrawer({
  personName,
  roleLabel,
  busy,
  onClose,
  onSubmit,
}: {
  personName: string;
  roleLabel: "teacher" | "parent";
  busy?: boolean;
  onClose: () => void;
  onSubmit: (payload: {
    newPassword: string;
    confirmPassword: string;
  }) => Promise<void>;
}) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !busy) {
        onClose();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [busy, onClose]);

  async function handleSubmit() {
    setError(null);
    if (newPassword.trim().length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    try {
      await onSubmit({
        newPassword: newPassword.trim(),
        confirmPassword: confirmPassword.trim(),
      });
    } catch (caught) {
      setError(getApiErrorMessage(caught, "Could not reset password"));
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
      <button
        type="button"
        aria-label="Close"
        disabled={busy}
        className="absolute inset-0 cursor-pointer bg-black/40 disabled:cursor-not-allowed"
        onClick={() => {
          if (!busy) {
            onClose();
          }
        }}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="reset-password-title"
        className="relative z-10 w-full max-w-lg rounded-3xl bg-surface p-6 shadow-xl sm:p-8"
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
              <KeyRound aria-hidden className="h-4 w-4" />
              Reset password
            </div>
            <h2
              id="reset-password-title"
              className="mt-3 text-2xl font-semibold text-foreground"
            >
              Set a new password
            </h2>
            <p className="mt-1 text-sm text-muted">
              Enter a new password for {roleLabel}{" "}
              <span className="font-medium text-foreground">{personName}</span>.
            </p>
          </div>
          <button
            type="button"
            aria-label="Close"
            disabled={busy}
            onClick={onClose}
            className="inline-flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full hover:bg-primary-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X aria-hidden className="h-5 w-5" />
          </button>
        </div>

        {error ? (
          <p
            className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            role="alert"
          >
            {error}
          </p>
        ) : null}

        <div className="space-y-4">
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-foreground">
              New password
            </span>
            <input
              type="password"
              autoComplete="new-password"
              value={newPassword}
              disabled={busy}
              onChange={(event) => setNewPassword(event.target.value)}
              placeholder="At least 6 characters"
              className={inputClass}
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-foreground">
              Confirm password
            </span>
            <input
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              disabled={busy}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Repeat password"
              className={inputClass}
            />
          </label>
        </div>

        <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            disabled={busy}
            onClick={onClose}
            className="inline-flex h-11 cursor-pointer items-center justify-center rounded-xl border border-border bg-white px-5 text-sm font-medium text-foreground transition-colors hover:bg-primary-soft disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void handleSubmit()}
            className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-medium text-on-primary transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            <KeyRound aria-hidden className="h-4 w-4" />
            {busy ? "Saving…" : "Save password"}
          </button>
        </div>
      </div>
    </div>
  );
}
