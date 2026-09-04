"use client";

import { useEffect, useId, useState } from "react";
import { Plus, X } from "lucide-react";
import { FilterSelect } from "@/components/dashboard/FilterSelect";
import { getApiErrorMessage } from "@/lib/getApiErrorMessage";
import {
  useGetGradeFormExpressionTypesQuery,
  useGetGradeFormExpressionsQuery,
  useReplaceGradeFormExpressionsMutation,
} from "@/features/school/api/gradeFormsApi";
import type { DashboardGradeFormDetailRow } from "@/features/school/types";

const inputClass =
  "h-11 w-full rounded-xl border border-border bg-white px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted/80 focus:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

type DraftExpressionItem = {
  key: string;
  sourceGradeTypeId: number;
  sourceGradeTypeTitle: string;
  percentage: number;
};

type GradeFormExpressionDrawerProps = {
  detail: DashboardGradeFormDetailRow;
  onClose: () => void;
};

function roundPercent(value: number): number {
  return Math.round(value * 100) / 100;
}

export function GradeFormExpressionDrawer({
  detail,
  onClose,
}: GradeFormExpressionDrawerProps) {
  const keyPrefix = useId();
  const [selectedGradeTypeId, setSelectedGradeTypeId] = useState(0);
  const [percentage, setPercentage] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [draftItems, setDraftItems] = useState<DraftExpressionItem[]>([]);
  const [draftSyncedForDetailId, setDraftSyncedForDetailId] = useState<
    number | null
  >(null);

  const [replaceExpressions, replaceState] =
    useReplaceGradeFormExpressionsMutation();
  const { data: expressionTypesData } = useGetGradeFormExpressionTypesQuery({
    gradeFormId: detail.gradeFormId,
    detailId: detail.id,
  });
  const { data: expressionsData, isLoading: expressionsLoading } =
    useGetGradeFormExpressionsQuery({
      gradeFormId: detail.gradeFormId,
      detailId: detail.id,
    });
  const busy = replaceState.isLoading;

  const usedIds = new Set(draftItems.map((item) => item.sourceGradeTypeId));
  const relatedOptions = (expressionTypesData?.items ?? [])
    .filter((item) => !usedIds.has(item.id))
    .map((item) => ({
      value: item.id,
      label: item.title,
    }));

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
    setSelectedGradeTypeId(0);
    setPercentage("");
    setFormError(null);
    setDraftSyncedForDetailId(null);
    setDraftItems([]);
  }, [detail.id]);

  useEffect(() => {
    if (!expressionsData || draftSyncedForDetailId === detail.id) {
      return;
    }
    setDraftItems(
      expressionsData.items.map((item, index) => ({
        key: `${keyPrefix}-${item.id}-${index}`,
        sourceGradeTypeId: item.sourceGradeTypeId,
        sourceGradeTypeTitle: item.sourceGradeTypeTitle,
        percentage: item.percentage,
      })),
    );
    setDraftSyncedForDetailId(detail.id);
  }, [expressionsData, detail.id, draftSyncedForDetailId, keyPrefix]);

  const total = roundPercent(
    draftItems.reduce((sum, item) => sum + item.percentage, 0),
  );
  const canSave = total === 100 && draftItems.length > 0 && !busy;

  function handleAdd() {
    setFormError(null);
    const value = Number(percentage);
    if (!selectedGradeTypeId) {
      setFormError("Select a related grade type.");
      return;
    }
    if (!Number.isFinite(value) || value <= 0 || value > 100) {
      setFormError("Enter a percentage between 0 and 100.");
      return;
    }
    if (usedIds.has(selectedGradeTypeId)) {
      setFormError("This grade type is already in the expression.");
      return;
    }
    if (roundPercent(total + value) > 100) {
      setFormError("Total cannot exceed 100%.");
      return;
    }

    const title =
      expressionTypesData?.items.find((item) => item.id === selectedGradeTypeId)
        ?.title ?? `Type #${selectedGradeTypeId}`;

    setDraftItems((current) => [
      ...current,
      {
        key: `${keyPrefix}-draft-${selectedGradeTypeId}-${Date.now()}`,
        sourceGradeTypeId: selectedGradeTypeId,
        sourceGradeTypeTitle: title,
        percentage: roundPercent(value),
      },
    ]);
    setSelectedGradeTypeId(0);
    setPercentage("");
  }

  function handleRemove(key: string) {
    setFormError(null);
    setDraftItems((current) => current.filter((item) => item.key !== key));
  }

  async function handleSave() {
    setFormError(null);
    if (total !== 100) {
      setFormError("Total must equal 100% before saving.");
      return;
    }

    try {
      await replaceExpressions({
        gradeFormId: detail.gradeFormId,
        detailId: detail.id,
        body: {
          items: draftItems.map((item) => ({
            sourceGradeTypeId: item.sourceGradeTypeId,
            percentage: item.percentage,
          })),
        },
      }).unwrap();
      onClose();
    } catch (caught) {
      setFormError(getApiErrorMessage(caught, "Could not save expression"));
    }
  }

  const listLoading =
    expressionsLoading || draftSyncedForDetailId !== detail.id;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <button
        type="button"
        aria-label="Close expression drawer"
        className="absolute inset-0 cursor-pointer bg-black/40"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="grade-form-expression-title"
        className="relative z-10 flex h-[90dvh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl bg-white shadow-xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-stone-100 bg-stone-50 px-5 py-4">
          <h2
            id="grade-form-expression-title"
            className="text-lg font-semibold text-foreground"
          >
            {detail.gradeTypeTitle} Expression
          </h2>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="inline-flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <X aria-hidden className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="min-w-0 flex-1">
              <FilterSelect
                label="Related grade type"
                value={selectedGradeTypeId}
                options={[
                  { value: 0, label: "Select grade type" },
                  ...relatedOptions,
                ]}
                onChange={setSelectedGradeTypeId}
              />
            </div>
            <input
              type="number"
              min={0}
              max={100}
              step={0.01}
              placeholder="Value in %"
              aria-label="Value in percent"
              className={`${inputClass} sm:w-36`}
              value={percentage}
              onChange={(event) => setPercentage(event.target.value)}
            />
            <button
              type="button"
              onClick={handleAdd}
              disabled={busy}
              className="inline-flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-xl bg-primary text-on-primary hover:bg-primary-hover disabled:opacity-50"
              aria-label="Add expression item"
            >
              <Plus aria-hidden className="h-4 w-4" />
            </button>
          </div>

          {formError ? (
            <p className="mt-3 text-sm text-red-600" role="alert">
              {formError}
            </p>
          ) : null}

          <ul className="mt-4 divide-y divide-stone-100 rounded-xl border border-border">
            {listLoading ? (
              <li className="px-4 py-24 text-center text-sm text-muted">
                Loading expressions…
              </li>
            ) : draftItems.length === 0 ? (
              <li className="px-4 py-24 text-center text-sm text-muted">
                No related grade types yet. Select a type and add a percentage.
              </li>
            ) : (
              draftItems.map((item) => (
                <li
                  key={item.key}
                  className="flex min-h-11 items-center justify-between gap-3 px-4 py-3 text-sm"
                >
                  <span className="min-w-0 font-medium text-foreground">
                    {item.sourceGradeTypeTitle}
                  </span>
                  <div className="flex shrink-0 items-center gap-4">
                    <span className="tabular-nums text-foreground">
                      {item.percentage}%
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemove(item.key)}
                      disabled={busy}
                      className="cursor-pointer text-sm font-medium text-red-600 hover:underline disabled:opacity-50"
                    >
                      Remove
                    </button>
                  </div>
                </li>
              ))
            )}
          </ul>

          <p className="mt-4 text-sm font-medium text-foreground">
            Total: {total}% / 100%
          </p>
        </div>

        <div className="flex justify-end gap-3 border-t border-stone-100 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-11 cursor-pointer items-center justify-center rounded-xl border border-border bg-white px-5 text-sm font-medium text-foreground hover:bg-stone-50"
          >
            Close
          </button>
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={!canSave}
            className="inline-flex h-11 cursor-pointer items-center justify-center rounded-xl bg-primary px-5 text-sm font-medium text-on-primary hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
