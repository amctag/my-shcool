"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import {
  Check,
  ChevronDown,
  ChevronUp,
  Eye,
  KeyRound,
  Pause,
  Pencil,
  Plus,
} from "lucide-react";
import { ResetPasswordDrawer } from "@/components/dashboard/ResetPasswordDrawer";
import { StatusFilterSelect } from "@/components/dashboard/StatusFilterSelect";
import { TableExportButtons } from "@/components/dashboard/TableExportButtons";
import { TableLoadingRow } from "@/components/dashboard/TableLoading";
import { TablePagination } from "@/components/dashboard/TablePagination";
import { TableSearchBar } from "@/components/dashboard/TableSearchBar";
import { NameWithInitials } from "@/components/dashboard/NameWithInitials";
import { getApiErrorMessage } from "@/lib/getApiErrorMessage";
import { fetchAllPaginatedItems } from "@/lib/exportTable";
import {
  useGetDirectorsQuery,
  useLazyGetDirectorsQuery,
  useResetDirectorPasswordMutation,
  useUpdateDirectorStatusMutation,
} from "@/features/school/api/directorsApi";
import { selectAuthReady, selectAccessToken } from "@/features/auth/authSlice";
import { useAppSelector } from "@/store/hooks";
import type {
  DashboardDirectorsQuery,
  DirectorsSortBy,
  DirectorsSortOrder,
  PersonStatusFilter,
} from "@/features/school/types";

function buildDirectorsQuery(
  page: number,
  limit: number,
  appliedFirstName: string,
  appliedMiddleName: string,
  appliedLastName: string,
  sortBy: DirectorsSortBy,
  sortOrder: DirectorsSortOrder,
  statusFilter: PersonStatusFilter,
): DashboardDirectorsQuery {
  const query: DashboardDirectorsQuery = { page, limit, sortBy, sortOrder };

  if (appliedFirstName) {
    query.firstName = appliedFirstName;
  }
  if (appliedMiddleName) {
    query.middleName = appliedMiddleName;
  }
  if (appliedLastName) {
    query.lastName = appliedLastName;
  }
  if (statusFilter !== "all") {
    query.status = statusFilter;
  }

  return query;
}

function directorName(
  firstName?: string,
  lastName?: string,
  fullName?: string,
): string {
  return (
    fullName?.trim() ||
    `${firstName?.trim() ?? ""} ${lastName?.trim() ?? ""}`.trim() ||
    "—"
  );
}

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

function formatBirthday(value?: string | null): string {
  if (!value) {
    return "—";
  }

  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) {
    return value;
  }

  const month = MONTHS[Number(match[2]) - 1];
  if (!month) {
    return value;
  }

  return `${month} ${Number(match[3])}, ${match[1]}`;
}

function isDirectorActive(status?: boolean) {
  return status !== false;
}

function IconColumnHeader({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <th className="w-14 px-2 py-3.5 text-center">
      <span
        className="inline-flex min-h-11 min-w-11 items-center justify-center text-muted"
        title={label}
        aria-label={label}
      >
        {children}
      </span>
    </th>
  );
}

function SortHeader({
  label,
  column,
  sortBy,
  sortOrder,
  onSort,
}: {
  label: string;
  column: DirectorsSortBy;
  sortBy: DirectorsSortBy;
  sortOrder: DirectorsSortOrder;
  onSort: (column: DirectorsSortBy) => void;
}) {
  const active = sortBy === column;
  const nextOrder = active && sortOrder === "asc" ? "descending" : "ascending";

  return (
    <th
      className="px-5 py-3.5"
      aria-sort={
        active ? (sortOrder === "asc" ? "ascending" : "descending") : "none"
      }
    >
      <button
        type="button"
        onClick={() => onSort(column)}
        className="inline-flex min-h-11 cursor-pointer items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        aria-label={`Sort by ${label} ${nextOrder}`}
      >
        {label}
        <span className="inline-flex flex-col -space-y-1" aria-hidden>
          <ChevronUp
            className={`h-3 w-3 ${
              active && sortOrder === "asc" ? "text-primary" : "text-muted/40"
            }`}
          />
          <ChevronDown
            className={`h-3 w-3 ${
              active && sortOrder === "desc" ? "text-primary" : "text-muted/40"
            }`}
          />
        </span>
      </button>
    </th>
  );
}

export function DirectorsTable() {
  const ready = useAppSelector(selectAuthReady);
  const accessToken = useAppSelector(selectAccessToken);
  const [firstNameInput, setFirstNameInput] = useState("");
  const [middleNameInput, setMiddleNameInput] = useState("");
  const [lastNameInput, setLastNameInput] = useState("");
  const [appliedFirstName, setAppliedFirstName] = useState("");
  const [appliedMiddleName, setAppliedMiddleName] = useState("");
  const [appliedLastName, setAppliedLastName] = useState("");
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<DirectorsSortBy>("id");
  const [sortOrder, setSortOrder] = useState<DirectorsSortOrder>("asc");
  const [statusFilterInput, setStatusFilterInput] =
    useState<PersonStatusFilter>("all");
  const [statusFilter, setStatusFilter] = useState<PersonStatusFilter>("all");
  const limit = 100;
  const [updateDirectorStatus, statusState] = useUpdateDirectorStatusMutation();
  const [resetDirectorPassword, resetPasswordState] =
    useResetDirectorPasswordMutation();
  const [statusError, setStatusError] = useState<string | null>(null);
  const [pendingResetPassword, setPendingResetPassword] = useState<{
    id: number;
    name: string;
  } | null>(null);
  const canFetch = ready && Boolean(accessToken);
  const query = buildDirectorsQuery(
    page,
    limit,
    appliedFirstName,
    appliedMiddleName,
    appliedLastName,
    sortBy,
    sortOrder,
    statusFilter,
  );

  const { data, error, isLoading, isFetching } = useGetDirectorsQuery(query, {
    skip: !canFetch,
  });
  const [fetchDirectors] = useLazyGetDirectorsQuery();

  async function fetchExportRows() {
    const items = await fetchAllPaginatedItems(async (exportPage, exportLimit) =>
      fetchDirectors(
        buildDirectorsQuery(
          exportPage,
          exportLimit,
          appliedFirstName,
          appliedMiddleName,
          appliedLastName,
          sortBy,
          sortOrder,
          statusFilter,
        ),
      ).unwrap(),
    );

    return items.map((director) => ({
      id: director.id,
      personId: director.personId,
      name: directorName(
        director.firstName,
        director.lastName,
        director.fullName,
      ),
      phone: director.phoneNumber ?? "",
      email: director.email ?? "",
      address: director.address ?? "",
      birthday: formatBirthday(director.birthday),
      status: isDirectorActive(director.status) ? "Active" : "Closed",
      school: director.schoolName ?? "",
    }));
  }

  function applySearch() {
    const nextFirstName = firstNameInput.trim();
    const nextMiddleName = middleNameInput.trim();
    const nextLastName = lastNameInput.trim();
    if (
      nextFirstName === appliedFirstName &&
      nextMiddleName === appliedMiddleName &&
      nextLastName === appliedLastName &&
      statusFilterInput === statusFilter
    ) {
      return;
    }
    setPage(1);
    setAppliedFirstName(nextFirstName);
    setAppliedMiddleName(nextMiddleName);
    setAppliedLastName(nextLastName);
    setStatusFilter(statusFilterInput);
  }

  function onSort(column: DirectorsSortBy) {
    setPage(1);
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
      return;
    }

    setSortBy(column);
    setSortOrder("asc");
  }

  const directors = data?.items ?? [];
  const pagination = data?.pagination;
  const totalPages = pagination?.totalPages ?? 0;

  async function toggleDirectorStatus(director: {
    id: number;
    status?: boolean;
  }) {
    setStatusError(null);
    try {
      await updateDirectorStatus({
        id: director.id,
        status: !isDirectorActive(director.status),
      }).unwrap();
    } catch (caught) {
      setStatusError(
        getApiErrorMessage(caught, "Could not update director status"),
      );
    }
  }

  return (
    <>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex w-full min-w-0 flex-col gap-3 sm:flex-row sm:items-center">
          <TableSearchBar hideInput onSearch={applySearch}>
            <label className="relative w-full min-w-0 shrink-0 sm:w-36">
              <span className="sr-only">First name</span>
              <input
                type="search"
                value={firstNameInput}
                onChange={(event) => setFirstNameInput(event.target.value)}
                placeholder="First name"
                className="h-11 w-full min-w-28 rounded-lg border border-border bg-white px-3 text-sm outline-none transition-colors duration-200 focus:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              />
            </label>
            <label className="relative w-full min-w-0 shrink-0 sm:w-36">
              <span className="sr-only">Middle name</span>
              <input
                type="search"
                value={middleNameInput}
                onChange={(event) => setMiddleNameInput(event.target.value)}
                placeholder="Middle name"
                className="h-11 w-full min-w-28 rounded-lg border border-border bg-white px-3 text-sm outline-none transition-colors duration-200 focus:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              />
            </label>
            <label className="relative w-full min-w-0 shrink-0 sm:w-36">
              <span className="sr-only">Family name</span>
              <input
                type="search"
                value={lastNameInput}
                onChange={(event) => setLastNameInput(event.target.value)}
                placeholder="Family"
                className="h-11 w-full min-w-28 rounded-lg border border-border bg-white px-3 text-sm outline-none transition-colors duration-200 focus:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              />
            </label>
            <StatusFilterSelect
              value={statusFilterInput}
              onChange={setStatusFilterInput}
            />
          </TableSearchBar>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <TableExportButtons
            title="Directors"
            filename="directors"
            columns={[
              { key: "id", header: "ID" },
              { key: "personId", header: "Person ID" },
              { key: "name", header: "Name" },
              { key: "phone", header: "Phone" },
              { key: "email", header: "Email" },
              { key: "address", header: "Address" },
              { key: "birthday", header: "Birthday" },
              { key: "status", header: "Status" },
              { key: "school", header: "School" },
            ]}
            fetchRows={fetchExportRows}
            disabled={!canFetch}
          />
          <Link
            href="/directors/add"
            className="inline-flex h-11 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-on-primary transition-colors duration-200 hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <Plus aria-hidden className="h-4 w-4" />
            Add
          </Link>
        </div>
      </div>
      {statusError ? (
        <p className="mb-4 text-sm text-red-600" role="alert">
          {statusError}
        </p>
      ) : null}
      <article className="overflow-hidden rounded-2xl bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-stone-200">
                <SortHeader
                  label="ID"
                  column="id"
                  sortBy={sortBy}
                  sortOrder={sortOrder}
                  onSort={onSort}
                />
                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-muted">
                  Person ID
                </th>
                <SortHeader
                  label="Name"
                  column="name"
                  sortBy={sortBy}
                  sortOrder={sortOrder}
                  onSort={onSort}
                />
                <SortHeader
                  label="Phone"
                  column="phone"
                  sortBy={sortBy}
                  sortOrder={sortOrder}
                  onSort={onSort}
                />
                <SortHeader
                  label="Email"
                  column="email"
                  sortBy={sortBy}
                  sortOrder={sortOrder}
                  onSort={onSort}
                />
                <SortHeader
                  label="Address"
                  column="address"
                  sortBy={sortBy}
                  sortOrder={sortOrder}
                  onSort={onSort}
                />
                <SortHeader
                  label="Birthday"
                  column="birthday"
                  sortBy={sortBy}
                  sortOrder={sortOrder}
                  onSort={onSort}
                />
                <IconColumnHeader label="Status">
                  <Pause aria-hidden className="h-4 w-4" />
                </IconColumnHeader>
                <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-muted">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <TableLoadingRow colSpan={9} label="Loading directors" />
              ) : error ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-5 py-10 text-center text-sm text-red-600"
                    role="alert"
                  >
                    {getApiErrorMessage(error, "Could not load directors")}
                  </td>
                </tr>
              ) : directors.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-5 py-10 text-center text-sm text-muted"
                  >
                    No directors match this search.
                  </td>
                </tr>
              ) : (
                directors.map((director) => (
                  <tr
                    key={director.id}
                    className={`border-b border-stone-100 last:border-b-0 ${
                      isFetching ? "opacity-70" : ""
                    }`}
                  >
                    <td className="whitespace-nowrap px-5 py-4 font-semibold text-foreground">
                      {director.id}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 tabular-nums text-foreground">
                      {director.personId ?? "—"}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 font-semibold text-foreground">
                      <Link
                        href={`/directors/${director.id}`}
                        className="inline-flex cursor-pointer rounded-xl text-foreground transition-colors duration-200 hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                      >
                        <NameWithInitials
                          firstName={director.firstName}
                          lastName={director.lastName}
                          name={directorName(
                            director.firstName,
                            director.lastName,
                            director.fullName,
                          )}
                        />
                      </Link>
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 tabular-nums text-foreground">
                      {director.phoneNumber ?? "—"}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-foreground">
                      {director.email ?? "—"}
                    </td>
                    <td className="px-5 py-4 text-foreground">
                      {director.address ?? "—"}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-foreground">
                      {formatBirthday(director.birthday)}
                    </td>
                    <td className="px-2 py-4 text-center">
                      <button
                        type="button"
                        aria-pressed={isDirectorActive(director.status)}
                        aria-label={
                          isDirectorActive(director.status)
                            ? "Active — click to close"
                            : "Closed — click to activate"
                        }
                        title={
                          isDirectorActive(director.status)
                            ? "Active — click to close"
                            : "Closed — click to activate"
                        }
                        disabled={statusState.isLoading}
                        onClick={() => void toggleDirectorStatus(director)}
                        className="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl hover:bg-primary-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isDirectorActive(director.status) ? (
                          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-white">
                            <Check
                              aria-hidden
                              className="h-4 w-4"
                              strokeWidth={3}
                            />
                          </span>
                        ) : (
                          <span className="relative inline-flex h-5 w-5 items-center justify-center">
                            <span className="h-5 w-5 rounded-full bg-primary" />
                            <span className="absolute h-2 w-2 rounded-full bg-white" />
                          </span>
                        )}
                      </button>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/directors/${director.id}`}
                          aria-label="View"
                          title="View"
                          className="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl border border-border bg-white text-foreground transition-colors duration-200 hover:bg-primary-soft hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                        >
                          <Eye aria-hidden className="h-4 w-4" />
                        </Link>
                        <Link
                          href={`/directors/${director.id}/edit`}
                          aria-label="Edit"
                          title="Edit"
                          className="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl border border-border bg-white text-foreground transition-colors duration-200 hover:bg-primary-soft hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                        >
                          <Pencil aria-hidden className="h-4 w-4" />
                        </Link>
                        <button
                          type="button"
                          aria-label="Reset password"
                          title="Reset password"
                          onClick={() =>
                            setPendingResetPassword({
                              id: director.id,
                              name: directorName(
                                director.firstName,
                                director.lastName,
                                director.fullName,
                              ),
                            })
                          }
                          className="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl border border-border bg-white text-foreground transition-colors duration-200 hover:bg-primary-soft hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                        >
                          <KeyRound aria-hidden className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {pagination && totalPages > 0 ? (
          <TablePagination
            page={page}
            totalPages={totalPages}
            total={pagination.total}
            label="directors"
            disabled={isFetching}
            onPageChange={(next) => setPage(next)}
          />
        ) : null}
      </article>
      {pendingResetPassword ? (
        <ResetPasswordDrawer
          personName={pendingResetPassword.name}
          roleLabel="director"
          busy={resetPasswordState.isLoading}
          onClose={() => {
            if (!resetPasswordState.isLoading) {
              setPendingResetPassword(null);
            }
          }}
          onSubmit={async (body) => {
            await resetDirectorPassword({
              id: pendingResetPassword.id,
              body,
            }).unwrap();
            setPendingResetPassword(null);
          }}
        />
      ) : null}
    </>
  );
}
