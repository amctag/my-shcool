"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { TableSearchBar } from "@/components/dashboard/TableSearchBar";
import { mockGradesByType } from "@/features/school/mocks/grades";

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
        active
          ? "bg-emerald-50 text-emerald-700"
          : "bg-stone-100 text-muted"
      }`}
    >
      {active ? "Active" : "Inactive"}
    </span>
  );
}

export function GradesByTypeTable() {
  const [searchInput, setSearchInput] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");

  const items = useMemo(() => {
    const query = appliedSearch.trim().toLowerCase();
    if (!query) {
      return mockGradesByType;
    }
    return mockGradesByType.filter((item) =>
      [item.title, item.type].some((part) =>
        part.toLowerCase().includes(query),
      ),
    );
  }, [appliedSearch]);

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
          disabled
          title="Coming soon"
          className="inline-flex h-11 shrink-0 cursor-not-allowed items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-on-primary opacity-50"
        >
          <Plus aria-hidden className="h-4 w-4" />
          Add
        </button>
      </div>

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
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td
                    colSpan={3}
                    className="px-5 py-10 text-center text-sm text-muted"
                  >
                    No grade types match this search.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
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
                    <td className="whitespace-nowrap px-5 py-4">
                      <StatusBadge active={item.status} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </article>

      <p className="mt-3 text-xs text-muted">
        Showing sample data. API integration coming next.
      </p>
    </>
  );
}
