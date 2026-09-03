"use client";

import { useEffect, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { FilterSelect } from "@/components/dashboard/FilterSelect";
import { ConfirmDeleteDialog } from "@/components/dashboard/ConfirmDeleteDialog";
import { LoadingDots } from "@/components/dashboard/TableLoading";
import { getApiErrorMessage } from "@/lib/getApiErrorMessage";
import { useGetDashboardGradeTypesListQuery } from "@/features/school/api/gradesApi";
import {
  useCreateGradeFormDetailMutation,
  useDeleteGradeFormDetailMutation,
  useGetGradeFormDetailsQuery,
  useGetGradeFormQuery,
  useUpdateGradeFormDetailMutation,
} from "@/features/school/api/gradeFormsApi";
import type {
  DashboardGradeFormDetailRow,
  SaveGradeFormDetailBody,
} from "@/features/school/types";
import { GradeFormExpressionDrawer } from "@/features/school/components/GradeFormExpressionDrawer";

const inputClass =
  "h-11 shrink-0 rounded-xl border border-border bg-white px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted/80 focus:border-primary";

type DetailFormState = {
  gradeTypeId: number;
  position: string;
  status: string;
  isVisible: string;
};

function emptyDetailForm(): DetailFormState {
  return {
    gradeTypeId: 0,
    position: "",
    status: "1",
    isVisible: "1",
  };
}

function detailToForm(item: DashboardGradeFormDetailRow): DetailFormState {
  return {
    gradeTypeId: item.gradeTypeId,
    position: String(item.position),
    status: item.status ? "1" : "0",
    isVisible: item.isVisible ? "1" : "0",
  };
}

function formToBody(form: DetailFormState): SaveGradeFormDetailBody | null {
  if (!form.gradeTypeId) {
    return null;
  }
  const position = form.position.trim() === "" ? 0 : Number(form.position);
  if (!Number.isFinite(position) || position < 0) {
    return null;
  }

  return {
    gradeTypeId: form.gradeTypeId,
    position,
    status: form.status === "1",
    isVisible: form.isVisible === "1",
  };
}

function DetailFormFields({
  form,
  onChange,
  gradeTypeOptions,
  inline = false,
}: {
  form: DetailFormState;
  onChange: (next: DetailFormState) => void;
  gradeTypeOptions: { value: number; label: string }[];
  inline?: boolean;
}) {
  const fields = (
    <>
      <FilterSelect
        label="Grade type"
        value={form.gradeTypeId}
        options={[{ value: 0, label: "Grade type" }, ...gradeTypeOptions]}
        onChange={(value) => onChange({ ...form, gradeTypeId: value })}
      />
      <input
        type="number"
        min={0}
        placeholder="Position"
        aria-label="Position"
        className={`${inputClass} w-28`}
        value={form.position}
        onChange={(event) =>
          onChange({ ...form, position: event.target.value })
        }
      />
      <FilterSelect
        label="Status"
        value={form.status}
        options={[
          { value: "1", label: "Active" },
          { value: "0", label: "Inactive" },
        ]}
        onChange={(value) => onChange({ ...form, status: value })}
      />
      <FilterSelect
        label="Visible"
        value={form.isVisible}
        options={[
          { value: "1", label: "Yes" },
          { value: "0", label: "No" },
        ]}
        onChange={(value) => onChange({ ...form, isVisible: value })}
      />
    </>
  );

  if (inline) {
    return (
      <div className="flex flex-wrap items-center gap-2">{fields}</div>
    );
  }

  return <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{fields}</div>;
}

export function GradeFormDetailsPanel({
  gradeFormId,
}: {
  gradeFormId: number;
}) {
  const [addForm, setAddForm] = useState<DetailFormState>(emptyDetailForm);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<DetailFormState>(emptyDetailForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] =
    useState<DashboardGradeFormDetailRow | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [expressionDetail, setExpressionDetail] =
    useState<DashboardGradeFormDetailRow | null>(null);

  const { data: gradeForm, isLoading: gradeFormLoading } = useGetGradeFormQuery(
    gradeFormId,
  );
  const { data, error, isLoading, isFetching } = useGetGradeFormDetailsQuery(
    gradeFormId,
  );
  const { data: gradeTypesData } = useGetDashboardGradeTypesListQuery();
  const [createDetail, createState] = useCreateGradeFormDetailMutation();
  const [updateDetail, updateState] = useUpdateGradeFormDetailMutation();
  const [deleteDetail, deleteState] = useDeleteGradeFormDetailMutation();

  const gradeTypeOptions =
    gradeTypesData?.items.map((item) => ({
      value: item.id,
      label: item.title,
    })) ?? [];

  const items = data?.items ?? [];
  const busy =
    createState.isLoading ||
    updateState.isLoading ||
    deleteState.isLoading;

  useEffect(() => {
    setAddForm(emptyDetailForm());
    setShowAddForm(false);
    setEditingId(null);
    setFormError(null);
    setExpressionDetail(null);
  }, [gradeFormId]);

  function openAddForm() {
    cancelEdit();
    setAddForm(emptyDetailForm());
    setShowAddForm(true);
    setFormError(null);
  }

  function cancelAdd() {
    setShowAddForm(false);
    setAddForm(emptyDetailForm());
    setFormError(null);
  }

  function startEdit(item: DashboardGradeFormDetailRow) {
    setShowAddForm(false);
    setAddForm(emptyDetailForm());
    setEditingId(item.id);
    setEditForm(detailToForm(item));
    setFormError(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditForm(emptyDetailForm());
    setFormError(null);
  }

  async function handleAdd() {
    setFormError(null);
    const body = formToBody(addForm);
    if (!body) {
      setFormError("Select a grade type and enter a valid position.");
      return;
    }
    try {
      await createDetail({ gradeFormId, body }).unwrap();
      cancelAdd();
    } catch (caught) {
      setFormError(getApiErrorMessage(caught, "Could not add detail"));
    }
  }

  async function handleUpdate(detailId: number) {
    setFormError(null);
    const body = formToBody(editForm);
    if (!body) {
      setFormError("Select a grade type and enter a valid position.");
      return;
    }
    try {
      await updateDetail({
        gradeFormId,
        detailId,
        body,
      }).unwrap();
      cancelEdit();
    } catch (caught) {
      setFormError(getApiErrorMessage(caught, "Could not update detail"));
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) {
      return;
    }
    setDeleteError(null);
    try {
      await deleteDetail({
        gradeFormId,
        detailId: pendingDelete.id,
      }).unwrap();
      if (editingId === pendingDelete.id) {
        cancelEdit();
      }
      setPendingDelete(null);
    } catch (caught) {
      setDeleteError(getApiErrorMessage(caught, "Could not delete detail"));
    }
  }

  if (gradeFormLoading || isLoading) {
    return (
      <div className="rounded-2xl bg-white p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <LoadingDots label="Loading details" />
      </div>
    );
  }

  if (error) {
    return (
      <p className="text-sm text-red-600" role="alert">
        {getApiErrorMessage(error, "Could not load details")}
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            Grade form details
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-foreground">
            {gradeForm?.title ?? data?.title}
          </h1>
          {gradeForm ? (
            <p className="mt-1 text-sm text-muted">
              {gradeForm.yearTitle} · Add, edit, or remove grade types in this
              form
            </p>
          ) : null}
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <button
            type="button"
            onClick={openAddForm}
            disabled={busy || showAddForm}
            className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-on-primary hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus aria-hidden className="h-4 w-4" />
            Add
          </button>
        </div>
      </div>

      {showAddForm ? (
        <section className="rounded-2xl border border-dashed border-border bg-white p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <DetailFormFields
              form={addForm}
              onChange={setAddForm}
              gradeTypeOptions={gradeTypeOptions}
              inline
            />
            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                onClick={cancelAdd}
                className="inline-flex h-11 cursor-pointer items-center rounded-lg border border-border px-4 text-sm font-medium hover:bg-primary-soft"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleAdd()}
                disabled={busy}
                className="inline-flex h-11 cursor-pointer items-center rounded-lg bg-primary px-4 text-sm font-medium text-on-primary hover:bg-primary-hover disabled:opacity-50"
              >
                Save
              </button>
            </div>
          </div>
        </section>
      ) : null}

      <article className="overflow-hidden rounded-2xl bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-stone-100 bg-stone-50/80">
              <tr>
                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-muted">
                  Grade type
                </th>
                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-muted">
                  Position
                </th>
                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-muted">
                  Status
                </th>
                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-muted">
                  Visible
                </th>
                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-muted">
                  Expression
                </th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-muted">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className={isFetching || busy ? "opacity-70" : undefined}>
              {items.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-10 text-center text-sm text-muted"
                  >
                    No details yet. Click Add to create one.
                  </td>
                </tr>
              ) : (
                items.map((item) =>
                  editingId === item.id ? (
                    <tr
                      key={item.id}
                      className="border-b border-stone-100 bg-primary-soft/20"
                    >
                      <td colSpan={6} className="px-5 py-4">
                        <DetailFormFields
                          form={editForm}
                          onChange={setEditForm}
                          gradeTypeOptions={gradeTypeOptions}
                          inline
                        />
                        <div className="mt-3 flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={cancelEdit}
                            className="inline-flex h-10 cursor-pointer items-center rounded-lg border border-border px-3 text-sm hover:bg-white"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleUpdate(item.id)}
                            disabled={busy}
                            className="inline-flex h-10 cursor-pointer items-center rounded-lg bg-primary px-3 text-sm font-medium text-on-primary hover:bg-primary-hover disabled:opacity-50"
                          >
                            Save
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    <tr
                      key={item.id}
                      className="border-b border-stone-100 last:border-b-0 odd:bg-white even:bg-primary-soft/50"
                    >
                      <td className="px-5 py-4 font-medium text-foreground">
                        {item.gradeTypeTitle}
                      </td>
                      <td className="px-5 py-4 text-foreground">
                        {item.position}
                      </td>
                      <td className="px-5 py-4 text-foreground">
                        {item.status ? "Active" : "Inactive"}
                      </td>
                      <td className="px-5 py-4 text-foreground">
                        {item.isVisible ? "Yes" : "No"}
                      </td>
                      <td className="px-5 py-4">
                        <button
                          type="button"
                          onClick={() => setExpressionDetail(item)}
                          className="inline-flex h-10 cursor-pointer items-center rounded-lg border border-border px-3 text-sm font-medium hover:bg-primary-soft"
                        >
                          Edit
                        </button>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => startEdit(item)}
                            disabled={busy}
                            className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-border hover:bg-primary-soft disabled:opacity-50"
                            aria-label={`Edit ${item.gradeTypeTitle}`}
                          >
                            <Pencil aria-hidden className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setDeleteError(null);
                              setPendingDelete(item);
                            }}
                            disabled={busy}
                            className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-border text-red-600 hover:bg-red-50 disabled:opacity-50"
                            aria-label={`Delete ${item.gradeTypeTitle}`}
                          >
                            <Trash2 aria-hidden className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ),
                )
              )}
            </tbody>
          </table>
        </div>
      </article>

      {formError ? (
        <p className="text-sm text-red-600" role="alert">
          {formError}
        </p>
      ) : null}

      {expressionDetail ? (
        <GradeFormExpressionDrawer
          detail={
            items.find((item) => item.id === expressionDetail.id) ??
            expressionDetail
          }
          onClose={() => setExpressionDetail(null)}
        />
      ) : null}

      {pendingDelete ? (
        <ConfirmDeleteDialog
          title="Delete detail"
          description={`Are you sure you need to delete ${pendingDelete.gradeTypeTitle}? This cannot be undone.`}
          error={deleteError}
          busy={deleteState.isLoading}
          onCancel={() => {
            setPendingDelete(null);
            setDeleteError(null);
          }}
          onConfirm={() => void confirmDelete()}
        />
      ) : null}
    </div>
  );
}
