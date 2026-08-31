"use client";

import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";

export function ConfirmWarningDialog({
  title,
  description,
  children,
  confirmLabel = "Continue",
  busy,
  onCancel,
  onConfirm,
}: {
  title: string;
  description: string;
  children?: ReactNode;
  confirmLabel?: string;
  busy?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !busy) {
        onCancel();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [busy, onCancel]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
      <button
        type="button"
        aria-label="Close"
        disabled={busy}
        className="absolute inset-0 cursor-pointer bg-black/40 disabled:cursor-not-allowed"
        onClick={() => {
          if (!busy) {
            onCancel();
          }
        }}
      />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-warning-title"
        aria-describedby="confirm-warning-description"
        className="relative z-10 w-full max-w-lg rounded-3xl bg-surface p-6 shadow-xl sm:p-8"
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <h2
            id="confirm-warning-title"
            className="text-2xl font-semibold text-foreground"
          >
            {title}
          </h2>
          <button
            type="button"
            aria-label="Close"
            disabled={busy}
            onClick={onCancel}
            className="inline-flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full hover:bg-primary-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X aria-hidden className="h-5 w-5" />
          </button>
        </div>
        <p
          id="confirm-warning-description"
          className="text-sm leading-6 text-muted"
        >
          {description}
        </p>
        {children}
        <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            disabled={busy}
            onClick={onCancel}
            className="inline-flex h-11 cursor-pointer items-center justify-center rounded-xl border border-border bg-white px-5 text-sm font-medium text-foreground transition-colors duration-200 hover:bg-primary-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50"
          >
            Go back
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onConfirm}
            className="inline-flex h-11 cursor-pointer items-center justify-center rounded-xl bg-primary px-5 text-sm font-medium text-on-primary transition-colors duration-200 hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? "Saving…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
