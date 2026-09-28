"use client";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { getApiErrorMessage } from "@/lib/getApiErrorMessage";
import { useGetClassesQuery } from "@/features/school/api/classesApi";
import { useGetYearsQuery } from "@/features/school/api/sectionsApi";
import {
  useAddDashboardPackageItemMutation,
  useAssignDashboardPackageClassesMutation,
  useCreateDashboardRegistrationPackageMutation,
  useGetDashboardCurrenciesQuery,
  useGetDashboardItemsQuery,
  useGetDashboardRegistrationPackageQuery,
  useRemoveDashboardPackageClassMutation,
  useRemoveDashboardPackageItemMutation,
  useUpdateDashboardRegistrationPackageMutation,
} from "@/features/school/api/accountingApi";
import type { DashboardRegistrationPackage } from "@/features/school/types";

const input =
  "h-11 w-full rounded-lg border border-border bg-white px-3 text-sm";
export function RegistrationPackageForm({ id }: { id?: number }) {
  const detail = useGetDashboardRegistrationPackageQuery(id ?? 0, {
    skip: !id,
  });
  if (id && !detail.data)
    return <p className="p-6 text-sm text-muted">Loading package…</p>;
  return (
    <RegistrationPackageEditor
      key={detail.data?.id ?? "new"}
      id={id}
      registrationPackage={detail.data}
    />
  );
}

function RegistrationPackageEditor({
  id,
  registrationPackage,
}: {
  id?: number;
  registrationPackage?: DashboardRegistrationPackage;
}) {
  const router = useRouter();
  const years = useGetYearsQuery();
  const items = useGetDashboardItemsQuery({ page: 1, limit: 500 });
  const classes = useGetClassesQuery({ page: 1, limit: 500 });
  const currencies = useGetDashboardCurrenciesQuery();
  const [createPackage, creating] =
    useCreateDashboardRegistrationPackageMutation();
  const [updatePackage, updating] =
    useUpdateDashboardRegistrationPackageMutation();
  const [addItem] = useAddDashboardPackageItemMutation();
  const [removeItem] = useRemoveDashboardPackageItemMutation();
  const [assignClasses] = useAssignDashboardPackageClassesMutation();
  const [removeClass] = useRemoveDashboardPackageClassMutation();
  const [name, setName] = useState(registrationPackage?.name ?? "");
  const [yearId, setYearId] = useState(
    registrationPackage ? String(registrationPackage.yearId) : "",
  );
  const [itemId, setItemId] = useState("");
  const [price, setPrice] = useState("");
  const [currencyId, setCurrencyId] = useState("");
  const [mandatory, setMandatory] = useState(true);
  const [classIds, setClassIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  async function saveGeneral(event: FormEvent) {
    event.preventDefault();
    if (!name.trim() || !yearId)
      return setError("Package name and school year are required.");
    try {
      const body = { name: name.trim(), yearId: Number(yearId) };
      if (id) await updatePackage({ id, body }).unwrap();
      else {
        const created = await createPackage(body).unwrap();
        router.push(`/accounting/registration-packages/${created.id}/edit`);
      }
      setError(null);
    } catch (cause) {
      setError(getApiErrorMessage(cause, "Could not save package"));
    }
  }
  async function submitItem(event: FormEvent) {
    event.preventDefault();
    if (!id || !itemId || !currencyId || Number(price) < 0)
      return setError("Complete the package item fields.");
    try {
      await addItem({
        packageId: id,
        body: {
          itemId: Number(itemId),
          price: Number(price),
          mandatory,
          currencyId: Number(currencyId),
        },
      }).unwrap();
      setItemId("");
      setPrice("");
      setError(null);
    } catch (cause) {
      setError(getApiErrorMessage(cause, "Could not add package item"));
    }
  }
  async function submitClasses() {
    if (!id || !classIds.length) return setError("Select at least one class.");
    try {
      await assignClasses({
        packageId: id,
        classIds: classIds.map(Number),
      }).unwrap();
      setClassIds([]);
      setError(null);
    } catch (cause) {
      setError(getApiErrorMessage(cause, "Could not assign classes"));
    }
  }
  return (
    <div className="space-y-6">
      <form
        onSubmit={saveGeneral}
        className="rounded-2xl border border-border bg-white p-6"
      >
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">
              {id ? "Edit registration package" : "New registration package"}
            </h1>
            <p className="text-sm text-muted">General</p>
          </div>
          {id ? (
            <div className="flex gap-3 text-sm">
              <span>Items: {registrationPackage?._count.items ?? 0}</span>
              <span>Classes: {registrationPackage?._count.classes ?? 0}</span>
            </div>
          ) : null}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
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
              onChange={(event) => setYearId(event.target.value)}
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
        {error ? (
          <p role="alert" className="mt-4 text-sm text-red-700">
            {error}
          </p>
        ) : null}
        <button
          disabled={creating.isLoading || updating.isLoading}
          className="mt-5 rounded-lg bg-primary px-5 py-3 text-sm font-medium text-on-primary"
        >
          Save general details
        </button>
      </form>
      {id ? (
        <>
          <section className="rounded-2xl border border-border bg-white p-6">
            <h2 className="text-lg font-semibold">Items</h2>
            <form
              onSubmit={submitItem}
              className="mt-4 grid gap-3 md:grid-cols-[1.4fr_0.7fr_0.7fr_auto_auto]"
            >
              <select
                className={input}
                value={itemId}
                onChange={(event) => setItemId(event.target.value)}
              >
                <option value="">Select item</option>
                {items.data?.items.map((row) => (
                  <option key={row.id} value={row.id}>
                    {row.name}
                  </option>
                ))}
              </select>
              <input
                className={input}
                type="number"
                min="0"
                step="0.01"
                placeholder="Price"
                value={price}
                onChange={(event) => setPrice(event.target.value)}
              />
              <select
                className={input}
                value={currencyId}
                onChange={(event) => setCurrencyId(event.target.value)}
              >
                <option value="">Currency</option>
                {currencies.data?.map((row) => (
                  <option key={row.id} value={row.id}>
                    {row.symbol} / {row.shortCode}
                  </option>
                ))}
              </select>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={mandatory}
                  onChange={(event) => setMandatory(event.target.checked)}
                />{" "}
                Mandatory
              </label>
              <button className="rounded-lg border border-border px-3">
                <Plus className="h-4 w-4" />
              </button>
            </form>
            <div className="mt-4 divide-y divide-border rounded-xl border border-border">
              {registrationPackage?.items?.map((row) => (
                <div
                  key={row.id}
                  className="flex items-center justify-between gap-3 p-3 text-sm"
                >
                  <span>
                    {row.item.name} · {row.currency?.symbol}
                    {Number(row.price).toFixed(2)} ·{" "}
                    {row.mandatory ? "Mandatory" : "Optional"}
                  </span>
                  <button
                    onClick={() =>
                      void removeItem({ packageId: id, relationId: row.id })
                    }
                    className="text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </section>
          <section className="rounded-2xl border border-border bg-white p-6">
            <h2 className="text-lg font-semibold">Classes</h2>
            <div className="mt-4 flex flex-wrap gap-3">
              <select
                multiple
                className="min-h-32 min-w-64 flex-1 rounded-lg border border-border p-3"
                value={classIds}
                onChange={(event) =>
                  setClassIds(
                    Array.from(
                      event.target.selectedOptions,
                      (option) => option.value,
                    ),
                  )
                }
              >
                {classes.data?.items.map((row) => (
                  <option key={row.id} value={row.id}>
                    {row.className} · Level {row.classLevel}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => void submitClasses()}
                className="self-end rounded-lg bg-primary px-4 py-3 text-sm text-on-primary"
              >
                Assign selected
              </button>
            </div>
            <div className="mt-4 divide-y divide-border rounded-xl border border-border">
              {registrationPackage?.classes?.map((row) => (
                <div
                  key={row.id}
                  className="flex items-center justify-between p-3 text-sm"
                >
                  <span>
                    {row.class.className} · Level {row.class.classLevel}
                  </span>
                  <button
                    onClick={() =>
                      void removeClass({ packageId: id, relationId: row.id })
                    }
                    className="text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
