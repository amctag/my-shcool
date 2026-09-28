"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { getApiErrorMessage } from "@/lib/getApiErrorMessage";
import {
  useCreateDashboardItemMutation,
  useGetDashboardItemQuery,
  useGetDashboardItemTypesQuery,
  useUpdateDashboardItemMutation,
} from "@/features/school/api/accountingApi";

export function ItemForm({ id }: { id?: number }) {
  const item = useGetDashboardItemQuery(id ?? 0, { skip: !id });
  if (id && !item.data) {
    return <p className="p-6 text-sm text-muted">Loading item…</p>;
  }
  return (
    <ItemEditor
      key={item.data?.id ?? "new"}
      id={id}
      initialName={item.data?.name ?? ""}
      initialItemTypeId={item.data ? String(item.data.itemTypeId) : ""}
      initialPrice={item.data?.price ?? "0"}
    />
  );
}

function ItemEditor({
  id,
  initialName,
  initialItemTypeId,
  initialPrice,
}: {
  id?: number;
  initialName: string;
  initialItemTypeId: string;
  initialPrice: string;
}) {
  const router = useRouter();
  const types = useGetDashboardItemTypesQuery();
  const [createItem, createState] = useCreateDashboardItemMutation();
  const [updateItem, updateState] = useUpdateDashboardItemMutation();
  const [name, setName] = useState(initialName);
  const [itemTypeId, setItemTypeId] = useState(initialItemTypeId);
  const [price, setPrice] = useState(initialPrice);
  const [error, setError] = useState<string | null>(null);
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (
      !name.trim() ||
      !itemTypeId ||
      !Number.isFinite(Number(price)) ||
      Number(price) < 0
    )
      return setError("Name, item type, and a valid base price are required.");
    try {
      const body = {
        name: name.trim(),
        itemTypeId: Number(itemTypeId),
        price: Number(price),
      };
      if (id) await updateItem({ id, body }).unwrap();
      else await createItem(body).unwrap();
      router.push("/accounting/items");
    } catch (cause) {
      setError(getApiErrorMessage(cause, "Could not save item"));
    }
  }
  return (
    <form
      onSubmit={submit}
      className="mx-auto max-w-xl space-y-5 rounded-2xl border border-border bg-white p-6"
    >
      <h1 className="text-xl font-semibold">{id ? "Edit item" : "New item"}</h1>
      <label className="block text-sm font-medium">
        Name *
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="mt-1.5 h-11 w-full rounded-lg border border-border px-3"
        />
      </label>
      <label className="block text-sm font-medium">
        Base Price *
        <input
          type="number"
          min="0"
          step="0.01"
          value={price}
          onChange={(event) => setPrice(event.target.value)}
          className="mt-1.5 h-11 w-full rounded-lg border border-border px-3"
        />
      </label>
      <label className="block text-sm font-medium">
        Item Type *
        <select
          value={itemTypeId}
          onChange={(event) => setItemTypeId(event.target.value)}
          className="mt-1.5 h-11 w-full rounded-lg border border-border bg-white px-3"
        >
          <option value="">Select type</option>
          {types.data?.map((type) => (
            <option key={type.id} value={type.id}>
              {type.name}
            </option>
          ))}
        </select>
      </label>
      {error ? (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      ) : null}
      <button
        disabled={createState.isLoading || updateState.isLoading}
        className="rounded-lg bg-primary px-5 py-3 text-sm font-medium text-on-primary"
      >
        Save item
      </button>
    </form>
  );
}
