"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Wallet } from "lucide-react";
import { LoadingDots } from "@/components/dashboard/TableLoading";
import { TablePagination } from "@/components/dashboard/TablePagination";
import { getApiErrorMessage } from "@/lib/getApiErrorMessage";
import {
  useGetDashboardCurrenciesQuery,
  useGetDashboardPaymentsQuery,
} from "@/features/school/api/accountingApi";
import { selectAuthReady, selectAccessToken } from "@/features/auth/authSlice";
import { useAppSelector } from "@/store/hooks";

const PAGE_SIZE = 10;

function formatAmount(value: string): string {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed.toFixed(2) : value;
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function PaymentsList() {
  const ready = useAppSelector(selectAuthReady);
  const accessToken = useAppSelector(selectAccessToken);
  const canFetch = ready && Boolean(accessToken);
  const [page, setPage] = useState(1);

  const { data, error, isLoading, isFetching } = useGetDashboardPaymentsQuery(
    { page, limit: PAGE_SIZE },
    { skip: !canFetch },
  );
  const { data: currencies = [] } = useGetDashboardCurrenciesQuery(undefined, {
    skip: !canFetch,
  });

  if (isLoading || !canFetch) {
    return <LoadingDots label="Loading payments" />;
  }

  const items = data?.items ?? [];
  const totalPages = data?.totalPages ?? 0;
  const total = data?.total ?? 0;
  const symbolFor = (currencyId: number | null): string =>
    currencies.find((currency) => currency.id === currencyId)?.symbol ?? "";

  return (
    <>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <p className="text-sm text-muted">
          Money leaving the school Cash account, posted against the selected
          destination account.
        </p>
        <Link
          href="/accounting/payments/add"
          className="inline-flex h-11 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-on-primary hover:bg-primary-hover"
        >
          <Plus aria-hidden className="h-4 w-4" />
          New payment
        </Link>
      </div>

      {error ? (
        <p
          className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700"
          role="alert"
        >
          {getApiErrorMessage(error, "Could not load payments")}
        </p>
      ) : items.length === 0 ? (
        <p className="rounded-2xl border border-border bg-white px-6 py-10 text-center text-sm text-muted">
          No payments yet. Create the first one.
        </p>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            {items.map((item) => (
              <article
                key={item.id}
                className={`overflow-hidden rounded-2xl border border-border bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] ${isFetching ? "opacity-70" : ""}`}
              >
                <div className="flex items-start gap-3">
                  <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
                    <Wallet aria-hidden className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-lg font-semibold text-foreground">
                      Payment #{item.nb}
                    </h2>
                    <p className="mt-1 text-[15px] font-medium text-foreground">
                      {item.accountName}
                    </p>
                    <p className="mt-1 text-sm text-muted">
                      Account {item.accountCode} ·{" "}
                      {`${symbolFor(item.currencyId)}${formatAmount(item.amount)}`}
                    </p>
                    {item.description ? (
                      <p className="mt-2 text-[15px] leading-relaxed text-foreground">
                        {item.description}
                      </p>
                    ) : null}
                    <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-stone-100 pt-4 text-sm text-muted">
                      <span>Posted {formatDateTime(item.dateCreated)}</span>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
          {totalPages > 0 ? (
            <TablePagination
              page={page}
              totalPages={totalPages}
              total={total}
              label="payments"
              disabled={isFetching}
              onPageChange={(next) => setPage(next)}
            />
          ) : null}
        </>
      )}
    </>
  );
}
