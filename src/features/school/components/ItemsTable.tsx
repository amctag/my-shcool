"use client";

import { useState } from "react";
import Link from "next/link";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { TablePagination } from "@/components/dashboard/TablePagination";
import { getApiErrorMessage } from "@/lib/getApiErrorMessage";
import {
  useDeleteDashboardItemMutation,
  useGetDashboardItemsQuery,
  useGetDashboardItemTypesQuery,
} from "@/features/school/api/accountingApi";

export function ItemsTable() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [itemTypeId, setItemTypeId] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const query = useGetDashboardItemsQuery({
    page,
    limit: 10,
    search: search || undefined,
    itemTypeId: itemTypeId ? Number(itemTypeId) : undefined,
  });
  const types = useGetDashboardItemTypesQuery();
  const [remove] = useDeleteDashboardItemMutation();
  async function removeItem(id: number) {
    if (!window.confirm("Delete this unused item?")) return;
    try {
      await remove(id).unwrap();
      setMessage(null);
    } catch (error) {
      setMessage(getApiErrorMessage(error, "Could not delete item"));
    }
  }
  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <Link
          href="/accounting/items/add"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-medium text-on-primary"
        >
          <Plus className="h-4 w-4" /> New item
        </Link>
      </div>
      <div className="flex flex-wrap gap-3 rounded-2xl border border-border bg-white p-4">
        <input
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
          placeholder="Search items"
          className="h-11 min-w-56 flex-1 rounded-lg border border-border px-3 text-sm"
        />
        <select
          value={itemTypeId}
          onChange={(event) => {
            setItemTypeId(event.target.value);
            setPage(1);
          }}
          className="h-11 rounded-lg border border-border bg-white px-3 text-sm"
        >
          <option value="">All item types</option>
          {types.data?.map((type) => (
            <option key={type.id} value={type.id}>
              {type.name}
            </option>
          ))}
        </select>
      </div>
      {message ? (
        <p
          role="alert"
          className="rounded-xl bg-red-50 p-3 text-sm text-red-700"
        >
          {message}
        </p>
      ) : null}
      <div className="overflow-x-auto rounded-2xl border border-border bg-white">
        <table className="w-full text-sm">
          <thead className="bg-stone-50 text-left text-xs uppercase text-muted">
            <tr>
              <th className="px-5 py-4">ID</th>
              <th className="px-5 py-4">Item Name</th>
              <th className="px-5 py-4">Item Type</th>
              <th className="px-5 py-4">Base Price</th>
              <th className="px-5 py-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {query.isLoading ? (
              <tr>
                <td colSpan={5} className="p-10 text-center">
                  Loading items…
                </td>
              </tr>
            ) : query.error ? (
              <tr>
                <td colSpan={5} className="p-10 text-center text-red-700">
                  {getApiErrorMessage(query.error, "Could not load items")}
                </td>
              </tr>
            ) : query.data?.items.length ? (
              query.data.items.map((item) => (
                <tr key={item.id} className="border-t border-border">
                  <td className="px-5 py-4">{item.id}</td>
                  <td className="px-5 py-4 font-medium">{item.name}</td>
                  <td className="px-5 py-4">{item.itemType.name}</td>
                  <td className="px-5 py-4">{Number(item.price).toFixed(2)}</td>
                  <td className="flex gap-2 px-5 py-4">
                    <Link
                      href={`/accounting/items/${item.id}/edit`}
                      className="rounded-lg border border-border p-2"
                      aria-label={`Edit ${item.name}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </Link>
                    <button
                      onClick={() => void removeItem(item.id)}
                      className="rounded-lg border border-border p-2 text-red-700"
                      aria-label={`Delete ${item.name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="p-10 text-center text-muted">
                  No items found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {(query.data?.totalPages ?? 0) > 0 ? (
        <TablePagination
          page={page}
          totalPages={query.data?.totalPages ?? 0}
          total={query.data?.total ?? 0}
          label="items"
          disabled={query.isFetching}
          onPageChange={setPage}
        />
      ) : null}
    </div>
  );
}
