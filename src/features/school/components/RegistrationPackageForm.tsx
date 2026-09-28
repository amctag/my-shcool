"use client";
import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { getApiErrorMessage } from "@/lib/getApiErrorMessage";
import { useGetYearsQuery } from "@/features/school/api/sectionsApi";
import {
  useCreateDashboardRegistrationPackageMutation,
  useGetDashboardCurrenciesQuery,
  useGetDashboardItemsQuery,
  useGetDashboardPackageClassesQuery,
  useGetDashboardRegistrationPackageQuery,
  useUpdateDashboardRegistrationPackageMutation,
} from "@/features/school/api/accountingApi";
import type { DashboardRegistrationPackage } from "@/features/school/types";

const input =
  "h-11 w-full rounded-lg border border-border bg-white px-3 text-sm";
type ItemRow = {
  key: string;
  itemId: string;
  price: string;
  currencyId: string;
  mandatory: boolean;
};
const newKey = () => crypto.randomUUID();
const emptyItem = (): ItemRow => ({
  key: newKey(),
  itemId: "",
  price: "",
  currencyId: "",
  mandatory: true,
});

export function RegistrationPackageForm({ id }: { id?: number }) {
  const detail = useGetDashboardRegistrationPackageQuery(id ?? 0, {
    skip: !id,
  });
  if (id && !detail.data)
    return <p className="p-6 text-sm text-muted">Loading package…</p>;
  return (
    <Editor key={detail.data?.id ?? "new"} id={id} initial={detail.data} />
  );
}

function Editor({
  id,
  initial,
}: {
  id?: number;
  initial?: DashboardRegistrationPackage;
}) {
  const router = useRouter();
  const years = useGetYearsQuery();
  const items = useGetDashboardItemsQuery({ page: 1, limit: 500 });
  const currencies = useGetDashboardCurrenciesQuery();
  const [name, setName] = useState(initial?.name ?? "");
  const [yearId, setYearId] = useState(initial ? String(initial.yearId) : "");
  const [rows, setRows] = useState<ItemRow[]>(
    initial?.items?.map((row) => ({
      key: newKey(),
      itemId: String(row.itemId),
      price: row.price,
      currencyId: String(row.currencyId ?? ""),
      mandatory: row.mandatory,
    })) ?? [emptyItem()],
  );
  const [classIds, setClassIds] = useState<number[]>(
    initial?.classes?.map((row) => row.classId) ?? [],
  );
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const classes = useGetDashboardPackageClassesQuery(Number(yearId), {
    skip: !yearId,
  });
  const classOptions = classes.data;
  const [createPackage, createState] =
    useCreateDashboardRegistrationPackageMutation();
  const [updatePackage, updateState] =
    useUpdateDashboardRegistrationPackageMutation();
  const grouped = useMemo(() => {
    const result = new Map<string, NonNullable<typeof classOptions>>();
    for (const row of classOptions ?? []) {
      const query = search.toLowerCase();
      if (
        !row.className.toLowerCase().includes(query) &&
        !row.stage.title.toLowerCase().includes(query)
      )
        continue;
      const group = result.get(row.stage.title) ?? [];
      group.push(row);
      result.set(row.stage.title, group);
    }
    return result;
  }, [classOptions, search]);
  const updateRow = (rowKey: string, patch: Partial<ItemRow>) =>
    setRows((current) =>
      current.map((row) => (row.key === rowKey ? { ...row, ...patch } : row)),
    );
  const selectItem = (row: ItemRow, value: string) =>
    updateRow(row.key, {
      itemId: value,
      price:
        items.data?.items.find((item) => String(item.id) === value)?.price ??
        "",
    });
  const toggleClass = (classId: number) =>
    setClassIds((current) =>
      current.includes(classId)
        ? current.filter((value) => value !== classId)
        : [...current, classId],
    );
  const toggleStage = (ids: number[]) =>
    setClassIds((current) =>
      ids.every((value) => current.includes(value))
        ? current.filter((value) => !ids.includes(value))
        : [...new Set([...current, ...ids])],
    );
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!name.trim() || !yearId || !classIds.length)
      return setError(
        "Name, school year, and at least one class are required.",
      );
    const packageItems = rows.map((row) => ({
      itemId: Number(row.itemId),
      price: Number(row.price),
      currencyId: Number(row.currencyId),
      mandatory: row.mandatory,
    }));
    if (
      packageItems.some(
        (row) =>
          !row.itemId ||
          !row.currencyId ||
          !Number.isFinite(row.price) ||
          row.price < 0,
      )
    )
      return setError("Complete every package item row.");
    if (
      new Set(packageItems.map((row) => row.itemId)).size !==
      packageItems.length
    )
      return setError("Each item can appear only once.");
    try {
      const body = {
        name: name.trim(),
        yearId: Number(yearId),
        items: packageItems,
        classIds,
      };
      if (id) await updatePackage({ id, body }).unwrap();
      else await createPackage(body).unwrap();
      router.push("/accounting/registration-packages");
    } catch (cause) {
      setError(
        getApiErrorMessage(cause, "Could not save registration package"),
      );
    }
  }
  return (
    <form onSubmit={submit} className="space-y-6">
      <section className="rounded-2xl border border-border bg-white p-6">
        <h1 className="text-xl font-semibold">
          {id ? "Edit registration package" : "New registration package"}
        </h1>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium">
            Package Name *
            <input
              className={`${input} mt-1.5`}
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </label>
          <label className="text-sm font-medium">
            School Year *
            <select
              className={`${input} mt-1.5`}
              value={yearId}
              onChange={(event) => {
                setYearId(event.target.value);
                setClassIds([]);
              }}
            >
              <option value="">Select year</option>
              {years.data?.map((year) => (
                <option key={year.id} value={year.id}>
                  {year.title}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>
      <section className="rounded-2xl border border-border bg-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Package items</h2>
            <p className="text-sm text-muted">
              Base prices are prefilled and can be overridden.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setRows((current) => [...current, emptyItem()])}
            className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm"
          >
            <Plus className="h-4 w-4" /> Add item
          </button>
        </div>
        <div className="mt-4 space-y-3">
          {rows.map((row, index) => (
            <div
              key={row.key}
              className="grid gap-3 rounded-xl border border-border p-3 md:grid-cols-[1.4fr_.7fr_.7fr_auto_auto]"
            >
              <select
                aria-label={`Item ${index + 1}`}
                className={input}
                value={row.itemId}
                onChange={(event) => selectItem(row, event.target.value)}
              >
                <option value="">Select item</option>
                {items.data?.items.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} — base {Number(item.price).toFixed(2)}
                  </option>
                ))}
              </select>
              <input
                aria-label={`Price ${index + 1}`}
                className={input}
                type="number"
                min="0"
                step="0.01"
                value={row.price}
                onChange={(event) =>
                  updateRow(row.key, { price: event.target.value })
                }
                placeholder="Price"
              />
              <select
                aria-label={`Currency ${index + 1}`}
                className={input}
                value={row.currencyId}
                onChange={(event) =>
                  updateRow(row.key, { currencyId: event.target.value })
                }
              >
                <option value="">Currency</option>
                {currencies.data?.map((currency) => (
                  <option key={currency.id} value={currency.id}>
                    {currency.symbol} / {currency.shortCode}
                  </option>
                ))}
              </select>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={row.mandatory}
                  onChange={(event) =>
                    updateRow(row.key, { mandatory: event.target.checked })
                  }
                />{" "}
                Mandatory
              </label>
              <button
                type="button"
                disabled={rows.length === 1}
                onClick={() =>
                  setRows((current) =>
                    current.filter((item) => item.key !== row.key),
                  )
                }
                className="rounded-lg border border-border p-3 text-red-700 disabled:opacity-40"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </section>
      <section className="rounded-2xl border border-border bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Classes</h2>
            <p className="text-sm text-muted">
              Available in the selected year, grouped by stage.
            </p>
          </div>
          <input
            className={`${input} max-w-xs`}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search classes or stages"
          />
        </div>
        {!yearId ? (
          <p className="mt-4 text-sm text-muted">
            Select a school year to load classes.
          </p>
        ) : classes.isLoading ? (
          <p className="mt-4 text-sm text-muted">Loading classes…</p>
        ) : grouped.size === 0 ? (
          <p className="mt-4 text-sm text-muted">
            No classes are available for this school year.
          </p>
        ) : (
          <div className="mt-4 space-y-4">
            {Array.from(grouped.entries()).map(([stage, stageClasses]) => {
              const ids = stageClasses.map((row) => row.id);
              return (
                <fieldset
                  key={stage}
                  className="rounded-xl border border-border p-4"
                >
                  <legend className="px-2 font-semibold">{stage}</legend>
                  <label className="mb-3 flex items-center gap-2 text-sm font-medium">
                    <input
                      type="checkbox"
                      checked={ids.every((value) => classIds.includes(value))}
                      onChange={() => toggleStage(ids)}
                    />{" "}
                    Select all in {stage}
                  </label>
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {stageClasses.map((row) => (
                      <label
                        key={row.id}
                        className="flex items-center gap-2 rounded-lg bg-stone-50 p-3 text-sm"
                      >
                        <input
                          type="checkbox"
                          checked={classIds.includes(row.id)}
                          onChange={() => toggleClass(row.id)}
                        />{" "}
                        {row.className} · Level {row.classLevel}
                      </label>
                    ))}
                  </div>
                </fieldset>
              );
            })}
          </div>
        )}
      </section>
      {error ? (
        <p
          role="alert"
          className="rounded-xl bg-red-50 p-3 text-sm text-red-700"
        >
          {error}
        </p>
      ) : null}
      <div className="flex gap-3">
        <button
          disabled={createState.isLoading || updateState.isLoading}
          className="rounded-lg bg-primary px-5 py-3 text-sm font-medium text-on-primary"
        >
          {createState.isLoading || updateState.isLoading
            ? "Saving…"
            : "Save complete package"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/accounting/registration-packages")}
          className="rounded-lg border border-border px-5 py-3 text-sm"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
