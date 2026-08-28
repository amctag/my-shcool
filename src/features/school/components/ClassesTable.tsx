"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { TableSearchBar } from "@/components/dashboard/TableSearchBar";
import { useGetClassesQuery } from "@/features/school/api/classesApi";
import { selectAuthReady, selectAccessToken } from "@/features/auth/authSlice";
import { getApiErrorMessage } from "@/lib/getApiErrorMessage";
import { useAppSelector } from "@/store/hooks";
import type { ClassesSortOrder } from "@/features/school/types";

export function ClassesTable() {
  const ready = useAppSelector(selectAuthReady);
  const accessToken = useAppSelector(selectAccessToken);
  const canFetch = ready && Boolean(accessToken);
  const [searchInput, setSearchInput] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [sortOrder, setSortOrder] = useState<ClassesSortOrder>("asc");
  const { data: classes = [], error, isLoading, isFetching } = useGetClassesQuery(
    {
      ...(appliedSearch ? { search: appliedSearch } : {}),
      sortOrder,
    },
    { skip: !canFetch },
  );

  function applySearch() {
    const next = searchInput.trim();
    if (next === appliedSearch) {
      return;
    }
    setAppliedSearch(next);
  }

  return (
    <>
      <div className="mb-5">
        <TableSearchBar
          label="Search classes"
          placeholder="Search by class name"
          value={searchInput}
          onChange={setSearchInput}
          onSearch={applySearch}
        />
      </div>
      <article className="overflow-hidden rounded-2xl bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-stone-200">
                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-muted">
                  ID
                </th>
                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-muted">
                  Class
                </th>
                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-muted">
                  Stage
                </th>
                <th className="px-5 py-3.5">
                  <button
                    type="button"
                    onClick={() =>
                      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                    }
                    className="inline-flex min-h-11 cursor-pointer items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted hover:text-foreground"
                  >
                    Level
                    <span className="inline-flex flex-col -space-y-1" aria-hidden>
                      <ChevronUp
                        className={`h-3 w-3 ${sortOrder === "asc" ? "text-primary" : "text-muted/40"}`}
                      />
                      <ChevronDown
                        className={`h-3 w-3 ${sortOrder === "desc" ? "text-primary" : "text-muted/40"}`}
                      />
                    </span>
                  </button>
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-5 py-10 text-center text-sm text-muted"
                  >
                    Loading classes…
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-5 py-10 text-center text-sm text-red-600"
                    role="alert"
                  >
                    {getApiErrorMessage(error, "Could not load classes")}
                  </td>
                </tr>
              ) : classes.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-5 py-10 text-center text-sm text-muted"
                  >
                    {appliedSearch
                      ? "No classes match that name."
                      : "No classes are set up for this school."}
                  </td>
                </tr>
              ) : (
                classes.map((item) => (
                  <tr
                    key={item.id}
                    className={`border-b border-stone-100 last:border-b-0 ${isFetching ? "opacity-70" : ""}`}
                  >
                    <td className="whitespace-nowrap px-5 py-4 font-semibold text-foreground">
                      {item.id}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 font-semibold text-foreground">
                      {item.className}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-foreground">
                      {item.stageTitle}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-foreground">
                      {item.classLevel}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </article>
    </>
  );
}
