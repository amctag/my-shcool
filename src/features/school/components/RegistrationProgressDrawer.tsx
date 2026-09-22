"use client";

import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, CheckCircle2, RefreshCw, X, XCircle } from "lucide-react";
import { getApiErrorMessage } from "@/lib/getApiErrorMessage";
import { useBulkProgressRegistrationsMutation } from "@/features/school/api/registrationsApi";
import type { RegistrationProgressAction } from "@/features/school/types";

export type RegistrationProgressTarget = {
  id: number;
  studentName: string;
  className: string;
  classLevel: number;
};

type ResultRow = {
  id: number;
  studentName: string;
  ok: boolean;
  message: string;
};

function actionLabel(action: RegistrationProgressAction): string {
  if (action === "up") {
    return "Up";
  }
  if (action === "down") {
    return "Down";
  }
  return "Re-registration";
}

function actionDescription(action: RegistrationProgressAction): string {
  if (action === "up") {
    return "Create next-year registrations in the next class level for the selected students.";
  }
  if (action === "down") {
    return "Create next-year registrations in the previous class level for the selected students.";
  }
  return "Re-register the selected students in the same class for the next school year.";
}

function ActionIcon({ action }: { action: RegistrationProgressAction }) {
  if (action === "up") {
    return <ArrowUp aria-hidden className="h-5 w-5" />;
  }
  if (action === "down") {
    return <ArrowDown aria-hidden className="h-5 w-5" />;
  }
  return <RefreshCw aria-hidden className="h-5 w-5" />;
}

export function RegistrationProgressDrawer({
  action,
  targets,
  onClose,
  onDone,
}: {
  action: RegistrationProgressAction;
  targets: RegistrationProgressTarget[];
  onClose: () => void;
  onDone: () => void;
}) {
  const [bulkProgressRegistrations] = useBulkProgressRegistrationsMutation();
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState<ResultRow[] | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);
  const label = actionLabel(action);
  const finished = results != null;
  const successCount = results?.filter((row) => row.ok).length ?? 0;
  const failCount = results?.filter((row) => !row.ok).length ?? 0;

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !busy) {
        if (finished) {
          onDone();
        } else {
          onClose();
        }
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [busy, finished, onClose, onDone]);

  async function handleConfirm() {
    setBusy(true);
    setRequestError(null);
    try {
      const response = await bulkProgressRegistrations({
        action,
        registrationIds: targets.map((target) => target.id),
      }).unwrap();

      setResults(
        response.items.map((item) => ({
          id: item.registrationId,
          studentName: item.studentName,
          ok: item.ok,
          message: item.message,
        })),
      );
    } catch (caught) {
      setRequestError(
        getApiErrorMessage(
          caught,
          `Could not ${label.toLowerCase()} selected students`,
        ),
      );
    } finally {
      setBusy(false);
    }
  }

  function handleClose() {
    if (busy) {
      return;
    }
    if (finished) {
      onDone();
      return;
    }
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
      <button
        type="button"
        aria-label="Close"
        disabled={busy}
        className="absolute inset-0 cursor-pointer bg-black/40 disabled:cursor-not-allowed"
        onClick={handleClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="registration-progress-title"
        className="relative z-10 flex max-h-[90dvh] w-full max-w-xl flex-col overflow-hidden rounded-3xl bg-surface shadow-xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-5 sm:px-8 sm:py-6">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
              <ActionIcon action={action} />
              {label}
            </div>
            <h2
              id="registration-progress-title"
              className="mt-3 text-2xl font-semibold text-foreground"
            >
              {finished
                ? `${label} complete`
                : `${label} ${targets.length} ${targets.length === 1 ? "student" : "students"}`}
            </h2>
            <p className="mt-1 text-sm text-muted">
              {finished
                ? `${successCount} succeeded${failCount ? `, ${failCount} failed` : ""}.`
                : actionDescription(action)}
            </p>
          </div>
          <button
            type="button"
            aria-label="Close"
            disabled={busy}
            onClick={handleClose}
            className="inline-flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full hover:bg-primary-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X aria-hidden className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5 sm:px-8">
          {requestError ? (
            <p
              className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              role="alert"
            >
              {requestError}
            </p>
          ) : null}

          {!finished ? (
            <ul className="divide-y divide-stone-100 overflow-hidden rounded-2xl border border-border bg-white">
              {targets.map((target) => (
                <li
                  key={target.id}
                  className="flex items-start justify-between gap-3 px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">
                      {target.studentName}
                    </p>
                    <p className="text-xs text-muted">
                      {target.className} · Level {target.classLevel}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <ul className="divide-y divide-stone-100 overflow-hidden rounded-2xl border border-border bg-white">
              {results.map((row) => (
                <li
                  key={row.id}
                  className="flex items-start gap-3 px-4 py-3"
                >
                  {row.ok ? (
                    <CheckCircle2
                      aria-hidden
                      className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600"
                    />
                  ) : (
                    <XCircle
                      aria-hidden
                      className="mt-0.5 h-4 w-4 shrink-0 text-red-600"
                    />
                  )}
                  <div className="min-w-0">
                    <p className="font-medium text-foreground">
                      {row.studentName}
                    </p>
                    <p
                      className={`text-xs ${row.ok ? "text-muted" : "text-red-600"}`}
                    >
                      {row.message}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-border px-6 py-5 sm:flex-row sm:justify-end sm:px-8">
          {!finished ? (
            <>
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
                disabled={busy || targets.length === 0}
                onClick={() => void handleConfirm()}
                className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-medium text-on-primary transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ActionIcon action={action} />
                {busy ? "Working…" : `Confirm ${label}`}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onDone}
              className="inline-flex h-11 cursor-pointer items-center justify-center rounded-xl bg-primary px-5 text-sm font-medium text-on-primary transition-colors hover:bg-primary-hover"
            >
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
