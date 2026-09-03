"use client";

import { useMemo, useState } from "react";
import { Pencil, Plus } from "lucide-react";
import { FilterSelect } from "@/components/dashboard/FilterSelect";
import { TableSearchBar } from "@/components/dashboard/TableSearchBar";
import { TableLoadingRow } from "@/components/dashboard/TableLoading";
import { getApiErrorMessage } from "@/lib/getApiErrorMessage";
import { selectAuthReady } from "@/features/auth/authSlice";
import {
  useCreateGradeTypeMutation,
  useGetDashboardGradeTypesListQuery,
  useUpdateGradeTypeMutation,
} from "@/features/school/api/gradesApi";
import type {
  DashboardGradeTypeListItem,
  SaveGradeTypeBody,
} from "@/features/school/types";
import { useAppSelector } from "@/store/hooks";

const inputClass =
  "h-11 shrink-0 rounded-xl border border-border bg-white px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted/80 focus:border-primary";

const GRADE_TYPE_OPTIONS = [
  { value: "homework", label: "Homework" },
  { value: "test", label: "Test" },
  { value: "exam", label: "Exam" },
];

type GradeTypeFormState = {
  title: string;
  type: string;
  position: string;
  isAbstract: string;
  isMain: string;
  status: string;
};

function emptyForm(): GradeTypeFormState {
  return {
    title: "",
    type: "test",
    position: "",
    isAbstract: "0",
    isMain: "0",
    status: "1",
  };
}

function itemToForm(item: DashboardGradeTypeListItem): GradeTypeFormState {
  return {
    title: item.title,
    type: item.type,
    position: String(item.position),
    isAbstract: item.isAbstract ? "1" : "0",
    isMain: item.isMain ? "1" : "0",
    status: item.status ? "1" : "0",
  };
}

function formToBody(form: GradeTypeFormState): SaveGradeTypeBody | null {
  const title = form.title.trim();
  const type = form.type.trim();
  if (!title || !type) {
    return null;
  }
  const position = form.position.trim() === "" ? 0 : Number(form.position);
  if (!Number.isFinite(position) || position < 0) {
    return null;
  }
  return {
    title,
    type,
    position,
    isAbstract: form.isAbstract === "1",
    isMain: form.isMain === "1",
    status: form.status === "1",
  };
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
        active ? "bg-emerald-50 text-emerald-700" : "bg-stone-100 text-muted"
      }`}
    >
      {active ? "Active" : "Inactive"}
    </span>
  );
}

function YesNo({ value }: { value: boolean }) {
  return <span>{value ? "Yes" : "No"}</span>;
}

function GradeTypeFormFields({
  form,
  onChange,
}: {
  form: GradeTypeFormState;
  onChange: (next: GradeTypeFormState) => void;
}) {
  const typeOptions = GRADE_TYPE_OPTIONS.some((item) => item.value === form.type)
    ? GRADE_TYPE_OPTIONS
    : [...GRADE_TYPE_OPTIONS, { value: form.type, label: form.type }];

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        type="text"
        placeholder="Title"
        aria-label="Title"
        className={`${inputClass} min-w-48 flex-1`}
        value={form.title}
        onChange={(event) => onChange({ ...form, title: event.target.value })}
      />
      <FilterSelect
        label="Type"
        value={form.type}
        options={typeOptions}
        onChange={(value) => onChange({ ...form, type: value })}
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
        label="Abstract"
        value={form.isAbstract}
        options={[
          { value: "0", label: "Not abstract" },
          { value: "1", label: "Abstract" },
        ]}
        onChange={(value) => onChange({ ...form, isAbstract: value })}
      />
      <FilterSelect
        label="Main"
        value={form.isMain}
        options={[
          { value: "0", label: "Not main" },
          { value: "1", label: "Main" },
        ]}
        onChange={(value) => onChange({ ...form, isMain: value })}
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
    </div>
  );
}

export function GradesByTypeTable() {
  const authReady = useAppSelector(selectAuthReady);
  const [searchInput, setSearchInput] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState<GradeTypeFormState>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<GradeTypeFormState>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);

  const { data, error, isLoading, isFetching } =
    useGetDashboardGradeTypesListQuery(
      { includeInactive: true },
      { skip: !authReady },
    );
  const [createGradeType, createState] = useCreateGradeTypeMutation();
  const [updateGradeType, updateState] = useUpdateGradeTypeMutation();
  const busy = createState.isLoading || updateState.isLoading;

  const items = useMemo(() => {
    const rows = data?.items ?? [];
    const query = appliedSearch.trim().toLowerCase();
    if (!query) {
      return rows;
    }
    return rows.filter((item) =>
      [item.title, item.type].some((part) =>
        part.toLowerCase().includes(query),
      ),
    );
  }, [appliedSearch, data?.items]);

  function openAddForm() {
    setEditingId(null);
    setAddForm(emptyForm());
    setShowAddForm(true);
    setFormError(null);
  }

  function startEdit(item: DashboardGradeTypeListItem) {
    setShowAddForm(false);
    setEditingId(item.id);
    setEditForm(itemToForm(item));
    setFormError(null);
  }

  async function handleAdd() {
    setFormError(null);
    const body = formToBody(addForm);
    if (!body) {
      setFormError("Title and type are required.");
      return;
    }
    try {
      await createGradeType(body).unwrap();
      setShowAddForm(false);
      setAddForm(emptyForm());
    } catch (caught) {
      setFormError(getApiErrorMessage(caught, "Could not add grade type"));
    }
  }

  async function handleUpdate(id: number) {
    setFormError(null);
    const body = formToBody(editForm);
    if (!body) {
      setFormError("Title and type are required.");
      return;
    }
    try {
      await updateGradeType({ id, body }).unwrap();
      setEditingId(null);
    } catch (caught) {
      setFormError(getApiErrorMessage(caught, "Could not update grade type"));
    }
  }

  return (
    <>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <TableSearchBar
          label="Search grade types"
          placeholder="Search title or type"
          value={searchInput}
          onChange={setSearchInput}
          onSearch={() => setAppliedSearch(searchInput.trim())}
        />
        <button
          type="button"
          onClick={openAddForm}
          disabled={busy || showAddForm}
          className="inline-flex h-11 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-on-primary hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus aria-hidden className="h-4 w-4" />
          Add
        </button>
      </div>

      {showAddForm ? (
        <section className="mb-5 rounded-2xl border border-dashed border-border bg-white p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <GradeTypeFormFields form={addForm} onChange={setAddForm} />
          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setShowAddForm(false);
                setFormError(null);
              }}
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
        </section>
      ) : null}

      {formError ? (
        <p className="mb-4 text-sm text-red-600" role="alert">
          {formError}
        </p>
      ) : null}

      <article className="overflow-hidden rounded-2xl bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-stone-200">
                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-muted">
                  Title
                </th>
                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-muted">
                  Type
                </th>
                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-muted">
                  Position
                </th>
                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-muted">
                  Abstract
                </th>
                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-muted">
                  Main
                </th>
                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-muted">
                  Status
                </th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-muted">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className={isFetching || busy ? "opacity-70" : undefined}>
              {!authReady || isLoading ? (
                <TableLoadingRow colSpan={7} label="Loading grade types" />
              ) : error ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-10 text-center text-sm text-red-600"
                    role="alert"
                  >
                    {getApiErrorMessage(error, "Could not load grade types")}
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-10 text-center text-sm text-muted"
                  >
                    {appliedSearch
                      ? "No grade types match this search."
                      : "No grade types yet. Click Add to create one."}
                  </td>
                </tr>
              ) : (
                items.map((item) =>
                  editingId === item.id ? (
                    <tr
                      key={item.id}
                      className="border-b border-stone-100 bg-primary-soft/20"
                    >
                      <td colSpan={7} className="px-5 py-4">
                        <GradeTypeFormFields
                          form={editForm}
                          onChange={setEditForm}
                        />
                        <div className="mt-3 flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
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
                        {item.title}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 capitalize text-foreground">
                        {item.type}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-foreground">
                        {item.position}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-foreground">
                        <YesNo value={item.isAbstract} />
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-foreground">
                        <YesNo value={item.isMain} />
                      </td>
                      <td className="whitespace-nowrap px-5 py-4">
                        <StatusBadge active={item.status} />
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end">
                          {item.schoolId == null ? (
                            <span className="text-xs text-muted">Shared</span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => startEdit(item)}
                              disabled={busy}
                              className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-border hover:bg-primary-soft disabled:opacity-50"
                              aria-label={`Edit ${item.title}`}
                            >
                              <Pencil aria-hidden className="h-4 w-4" />
                            </button>
                          )}
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
    </>
  );
}
