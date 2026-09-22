"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowRightLeft, Check, X } from "lucide-react";
import { getApiErrorMessage } from "@/lib/getApiErrorMessage";
import { useUpdateRegistrationMutation } from "@/features/school/api/registrationsApi";
import { useGetSectionsQuery } from "@/features/school/api/sectionsApi";
import type { DashboardRegistration } from "@/features/school/types";

export function RegistrationMoveSectionDrawer({
  registration,
  onClose,
  onDone,
}: {
  registration: DashboardRegistration;
  onClose: () => void;
  onDone: () => void;
}) {
  const [sectionId, setSectionId] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [updateRegistration, updateState] = useUpdateRegistrationMutation();

  const { data: sectionsData, isLoading: sectionsLoading } = useGetSectionsQuery(
    {
      page: 1,
      limit: 50,
      classId: registration.classId,
      yearId: registration.yearId,
      sortBy: "section",
      sortOrder: "asc",
    },
  );

  const sectionOptions = useMemo(() => {
    const sections = sectionsData?.items ?? [];
    return sections
      .filter((section) => section.id !== registration.sectionId)
      .map((section) => ({
        value: section.id,
        label: section.sectionTitle,
      }));
  }, [registration.sectionId, sectionsData?.items]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !updateState.isLoading) {
        onClose();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose, updateState.isLoading]);

  useEffect(() => {
    if (sectionId > 0 && !sectionOptions.some((option) => option.value === sectionId)) {
      setSectionId(0);
    }
  }, [sectionId, sectionOptions]);

  async function handleConfirm() {
    if (!sectionId) {
      setError("Choose a section");
      return;
    }
    setError(null);
    try {
      await updateRegistration({
        id: registration.id,
        body: {
          studentId: registration.studentId,
          classId: registration.classId,
          sectionId,
        },
      }).unwrap();
      onDone();
    } catch (caught) {
      setError(getApiErrorMessage(caught, "Could not move student to section"));
    }
  }

  const busy = updateState.isLoading;
  const noOtherSections = !sectionsLoading && sectionOptions.length === 0;

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
        aria-labelledby="registration-move-section-title"
        className="relative z-10 flex max-h-[90dvh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-surface shadow-xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-5 sm:px-8 sm:py-6">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
              <ArrowRightLeft aria-hidden className="h-4 w-4" />
              Move
            </div>
            <h2
              id="registration-move-section-title"
              className="mt-3 text-2xl font-semibold text-foreground"
            >
              Move to another section
            </h2>
            <p className="mt-1 text-sm text-muted">
              Keep the same class and year; only change the section.
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

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-5 sm:px-8">
          {error ? (
            <p
              className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              role="alert"
            >
              {error}
            </p>
          ) : null}

          <div className="rounded-2xl border border-border bg-white px-4 py-3">
            <p className="font-medium text-foreground">
              {registration.studentName}
            </p>
            <p className="mt-1 text-sm text-muted">
              {registration.className} · Level {registration.classLevel} ·{" "}
              {registration.yearTitle}
            </p>
            <p className="mt-1 text-sm text-muted">
              Current section:{" "}
              <span className="font-medium text-foreground">
                {registration.sectionTitle}
              </span>
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">New section</p>
            {sectionsLoading ? (
              <p className="text-sm text-muted">Loading sections…</p>
            ) : noOtherSections ? (
              <p className="text-sm text-muted">
                No other sections in this class for {registration.yearTitle}.
              </p>
            ) : (
              <ul
                role="listbox"
                aria-label="New section"
                className="space-y-1"
              >
                {sectionOptions.map((option) => {
                  const selected = option.value === sectionId;
                  return (
                    <li key={option.value} role="option" aria-selected={selected}>
                      <label
                        className={`inline-flex min-h-11 cursor-pointer items-center gap-3 rounded-xl px-1 transition-colors duration-200 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-ring ${
                          busy
                            ? "cursor-not-allowed opacity-50"
                            : "hover:bg-primary-soft"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selected}
                          disabled={busy}
                          onChange={() => {
                            setError(null);
                            setSectionId(selected ? 0 : option.value);
                          }}
                          className="peer sr-only"
                          aria-label={`Select section ${option.label}`}
                        />
                        <span
                          aria-hidden
                          className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors duration-200 ${
                            selected
                              ? "border-primary bg-primary text-on-primary"
                              : "border-border bg-white"
                          }`}
                        >
                          {selected ? (
                            <Check className="h-3.5 w-3.5 stroke-[3]" />
                          ) : null}
                        </span>
                        <span
                          className={`text-sm ${
                            selected
                              ? "font-medium text-primary"
                              : "text-foreground"
                          }`}
                        >
                          {option.label}
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-border px-6 py-5 sm:flex-row sm:justify-end sm:px-8">
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
            disabled={busy || !sectionId || noOtherSections}
            onClick={() => void handleConfirm()}
            className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-medium text-on-primary transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ArrowRightLeft aria-hidden className="h-4 w-4" />
            {busy ? "Moving…" : "Move student"}
          </button>
        </div>
      </div>
    </div>
  );
}
