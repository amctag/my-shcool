"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { LoadingDots } from "@/components/dashboard/TableLoading";
import { getApiErrorMessage } from "@/lib/getApiErrorMessage";
import {
  useGetGradeFormClassesCoursesQuery,
  useUpdateGradeFormClassesMutation,
} from "@/features/school/api/gradeFormsApi";
import type { DashboardGradeForm } from "@/features/school/types";

type GradeFormClassesDrawerProps = {
  form: DashboardGradeForm;
  onClose: () => void;
};

export function GradeFormClassesDrawer({
  form,
  onClose,
}: GradeFormClassesDrawerProps) {
  const [selectedClassIds, setSelectedClassIds] = useState<number[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const { data, error, isLoading } = useGetGradeFormClassesCoursesQuery({
    id: form.id,
  });
  const [updateClasses, updateState] = useUpdateGradeFormClassesMutation();

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  useEffect(() => {
    setHydrated(false);
    setSelectedClassIds([]);
    setSaveError(null);
  }, [form.id]);

  useEffect(() => {
    if (!data || hydrated) {
      return;
    }
    setSelectedClassIds(data.classIds);
    setHydrated(true);
  }, [data, hydrated]);

  function toggleClass(classId: number) {
    setSelectedClassIds((current) =>
      current.includes(classId)
        ? current.filter((id) => id !== classId)
        : [...current, classId],
    );
  }

  async function handleSave() {
    setSaveError(null);
    try {
      await updateClasses({ id: form.id, classIds: selectedClassIds }).unwrap();
      onClose();
    } catch (caught) {
      setSaveError(
        getApiErrorMessage(caught, "Could not update grade form classes"),
      );
    }
  }

  const classes = data?.classes ?? [];
  const saving = updateState.isLoading;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <button
        type="button"
        aria-label="Close grade form drawer"
        className="absolute inset-0 cursor-pointer bg-black/40"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="grade-form-drawer-title"
        className="relative z-10 flex max-h-[90dvh] w-full max-w-lg flex-col overflow-hidden rounded-3xl bg-white shadow-xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-stone-100 px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              Grade form classes
            </p>
            <h2
              id="grade-form-drawer-title"
              className="mt-1 text-xl font-semibold text-foreground"
            >
              {form.title}
            </h2>
            <p className="mt-1 text-sm text-muted">
              {form.yearTitle} · Select classes for this grade form
            </p>
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

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {isLoading && !hydrated ? (
            <LoadingDots label="Loading classes" />
          ) : error ? (
            <p className="text-sm text-red-600" role="alert">
              {getApiErrorMessage(error, "Could not load classes")}
            </p>
          ) : classes.length === 0 ? (
            <p className="text-sm text-muted">No classes available.</p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {classes.map((item) => {
                const checked = selectedClassIds.includes(item.id);
                return (
                  <label
                    key={item.id}
                    className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm hover:bg-primary-soft"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleClass(item.id)}
                      className="h-4 w-4 accent-primary"
                    />
                    <span>{item.className}</span>
                  </label>
                );
              })}
            </div>
          )}

          {saveError ? (
            <p className="mt-4 text-sm text-red-600" role="alert">
              {saveError}
            </p>
          ) : null}
        </div>

        <div className="flex gap-3 border-t border-stone-100 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-11 flex-1 cursor-pointer items-center justify-center rounded-xl border border-border text-sm font-medium hover:bg-primary-soft"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving || isLoading}
            className="inline-flex h-11 flex-1 cursor-pointer items-center justify-center rounded-xl bg-primary text-sm font-medium text-on-primary hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Saving" : "Save classes"}
          </button>
        </div>
      </div>
    </div>
  );
}
