"use client";
import { useState } from "react";
import Link from "next/link";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { TablePagination } from "@/components/dashboard/TablePagination";
import { getApiErrorMessage } from "@/lib/getApiErrorMessage";
import {
  useDeleteDashboardRegistrationPackageMutation,
  useGetDashboardRegistrationPackagesQuery,
} from "@/features/school/api/accountingApi";
import { useGetYearsQuery } from "@/features/school/api/sectionsApi";

export function RegistrationPackagesTable() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [yearId, setYearId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const packages = useGetDashboardRegistrationPackagesQuery({
    page,
    limit: 10,
    search: search || undefined,
    yearId: yearId ? Number(yearId) : undefined,
  });
  const years = useGetYearsQuery();
  const [remove] = useDeleteDashboardRegistrationPackageMutation();
  async function removePackage(id: number) {
    if (!window.confirm("Delete this package and its configuration?")) return;
    try {
      await remove(id).unwrap();
      setError(null);
    } catch (cause) {
      setError(getApiErrorMessage(cause, "Could not delete package"));
    }
  }
  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <Link
          href="/accounting/registration-packages/add"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-medium text-on-primary"
        >
          <Plus className="h-4 w-4" /> New package
        </Link>
      </div>
      <div className="flex flex-wrap gap-3 rounded-2xl border border-border bg-white p-4">
        <input
          className="h-11 min-w-56 flex-1 rounded-lg border border-border px-3"
          placeholder="Search packages"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
        />
        <select
          className="h-11 rounded-lg border border-border bg-white px-3"
          value={yearId}
          onChange={(event) => {
            setYearId(event.target.value);
            setPage(1);
          }}
        >
          <option value="">All school years</option>
          {years.data?.map((year) => (
            <option key={year.id} value={year.id}>
              {year.title}
            </option>
          ))}
        </select>
      </div>
      {error ? (
        <p
          role="alert"
          className="rounded-xl bg-red-50 p-3 text-sm text-red-700"
        >
          {error}
        </p>
      ) : null}
      <div className="overflow-x-auto rounded-2xl border border-border bg-white">
        <table className="w-full text-sm">
          <thead className="bg-stone-50 text-left text-xs uppercase text-muted">
            <tr>
              <th className="px-5 py-4">Package Name</th>
              <th className="px-5 py-4">School Year</th>
              <th className="px-5 py-4">Items</th>
              <th className="px-5 py-4">Classes</th>
              <th className="px-5 py-4">Created</th>
              <th className="px-5 py-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {packages.isLoading ? (
              <tr>
                <td colSpan={6} className="p-10 text-center">
                  Loading packages…
                </td>
              </tr>
            ) : packages.error ? (
              <tr>
                <td colSpan={6} className="p-10 text-center text-red-700">
                  {getApiErrorMessage(
                    packages.error,
                    "Could not load packages",
                  )}
                </td>
              </tr>
            ) : packages.data?.items.length ? (
              packages.data.items.map((row) => (
                <tr key={row.id} className="border-t border-border">
                  <td className="px-5 py-4 font-medium">{row.name}</td>
                  <td className="px-5 py-4">{row.year.title}</td>
                  <td className="px-5 py-4">{row._count.items}</td>
                  <td className="px-5 py-4">{row._count.classes}</td>
                  <td className="px-5 py-4">
                    {new Date(row.dateCreated).toLocaleDateString()}
                  </td>
                  <td className="flex gap-2 px-5 py-4">
                    <Link
                      href={`/accounting/registration-packages/${row.id}/edit`}
                      className="rounded-lg border border-border p-2"
                    >
                      <Pencil className="h-4 w-4" />
                    </Link>
                    <button
                      onClick={() => void removePackage(row.id)}
                      className="rounded-lg border border-border p-2 text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="p-10 text-center text-muted">
                  No packages found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {(packages.data?.totalPages ?? 0) > 0 ? (
        <TablePagination
          page={page}
          totalPages={packages.data?.totalPages ?? 0}
          total={packages.data?.total ?? 0}
          label="packages"
          disabled={packages.isFetching}
          onPageChange={setPage}
        />
      ) : null}
    </div>
  );
}
