"use client";

import { useEffect, useState } from "react";
import { Plus, X } from "lucide-react";
import { FilterSelect } from "@/components/dashboard/FilterSelect";
import { getApiErrorMessage } from "@/lib/getApiErrorMessage";
import {
  useCreateGradeFormExpressionMutation,
  useDeleteGradeFormExpressionMutation,
  useGetGradeFormExpressionTypesQuery,
  useGetGradeFormExpressionsQuery,
} from "@/features/school/api/gradeFormsApi";
import type { DashboardGradeFormDetailRow } from "@/features/school/types";

const inputClass =
  "h-11 w-full rounded-xl border border-border bg-white px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted/80 focus:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

type GradeFormExpressionDrawerProps = {
  detail: DashboardGradeFormDetailRow;
  onClose: () => void;
};

export function GradeFormExpressionDrawer({
  detail,
  onClose,
}: GradeFormExpressionDrawerProps) {
  const [selectedGradeTypeId, setSelectedGradeTypeId] = useState(0);
  const [percentage, setPercentage] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const [createExpression, createState] = useCreateGradeFormExpressionMutation();
  const [deleteExpression, deleteState] = useDeleteGradeFormExpressionMutation();
  const { data: expressionTypesData } = useGetGradeFormExpressionTypesQuery({
    gradeFormId: detail.gradeFormId,
    detailId: detail.id,
  });
  const { data: expressionsData, isLoading: expressionsLoading } =
    useGetGradeFormExpressionsQuery({
      gradeFormId: detail.gradeFormId,
      detailId: detail.id,
    });
  const busy = createState.isLoading || deleteState.isLoading;

  const items = expressionsData?.items ?? [];
  const relatedOptions = (expressionTypesData?.items ?? []).map((item) => ({
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
  }, [detail.id]);

  const total = items.reduce((sum, item) => sum + item.percentage, 0);

  async function handleAdd() {
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
    if (total + value > 100) {
      setFormError("Total cannot exceed 100%.");
      return;
    }

    try {
      await createExpression({
        gradeFormId: detail.gradeFormId,
        detailId: detail.id,
        body: {
          sourceGradeTypeId: selectedGradeTypeId,
          percentage: value,
        },
      }).unwrap();
      setSelectedGradeTypeId(0);
      setPercentage("");
    } catch (caught) {
      setFormError(getApiErrorMessage(caught, "Could not add expression item"));
    }
  }

  async function handleRemove(percentageId: number) {
    setFormError(null);
    try {
      await deleteExpression({
        gradeFormId: detail.gradeFormId,
        detailId: detail.id,
        percentageId,
      }).unwrap();
    } catch (caught) {
      setFormError(
        getApiErrorMessage(caught, "Could not remove expression item"),
      );
    }
  }

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
              onClick={() => void handleAdd()}
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
            {expressionsLoading ? (
              <li className="px-4 py-24 text-center text-sm text-muted">
                Loading expressions…
              </li>
            ) : items.length === 0 ? (
              <li className="px-4 py-24 text-center text-sm text-muted">
                No related grade types yet. Select a type and add a percentage.
              </li>
            ) : (
              items.map((item) => (
                <li
                  key={item.id}
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
                      onClick={() => void handleRemove(item.id)}
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

        <div className="flex justify-end border-t border-stone-100 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-11 cursor-pointer items-center justify-center rounded-xl bg-primary px-5 text-sm font-medium text-on-primary hover:bg-primary-hover"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
