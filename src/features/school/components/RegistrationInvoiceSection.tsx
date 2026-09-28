"use client";

import { useEffect, useMemo, useState } from "react";
import { getApiErrorMessage } from "@/lib/getApiErrorMessage";
import { LoadingDots } from "@/components/dashboard/TableLoading";
import {
  useGetDashboardCurrenciesQuery,
  useGetDashboardPackagePreviewQuery,
} from "@/features/school/api/accountingApi";
import { selectAuthReady } from "@/features/auth/authSlice";
import { useAppSelector } from "@/store/hooks";

export type RegistrationInvoiceSelection = {
  enabled: boolean;
  currencyId: number | null;
  items: Array<{ itemId: number; unitPrice?: number; quantity?: number }>;
};

export function RegistrationInvoiceSection({
  studentId,
  classId,
  yearId,
  onChange,
}: {
  studentId: number;
  classId: number;
  yearId: number | null;
  onChange: (selection: RegistrationInvoiceSelection | null) => void;
}) {
  const ready = useAppSelector(selectAuthReady);
  const [enabledOverride, setEnabledOverride] = useState<{
    key: string;
    value: boolean;
  } | null>(null);
  const [selectedOverride, setSelectedOverride] = useState<{
    key: string;
    value: Record<number, boolean>;
  } | null>(null);
  const [pricesOverride, setPricesOverride] = useState<{
    key: string;
    value: Record<number, string>;
  } | null>(null);
  const [currencyOverride, setCurrencyOverride] = useState<{
    key: string;
    value: string;
  } | null>(null);

  const canFetch = ready && studentId > 0 && classId > 0 && yearId !== null;
  const {
    data: preview,
    error,
    isLoading,
    isFetching,
  } = useGetDashboardPackagePreviewQuery(
    { classId, yearId: yearId ?? 0, studentId },
    { skip: !canFetch },
  );
  const { data: currencies = [] } = useGetDashboardCurrenciesQuery(undefined, {
    skip: !ready,
  });

  const packageItems = useMemo(
    () => preview?.package?.items ?? [],
    [preview],
  );
  const packageKey = preview?.package ? `${preview.package.id}` : null;

  const defaultSelected = useMemo(() => {
    const next: Record<number, boolean> = {};
    for (const item of packageItems) {
      next[item.itemId] = true;
    }
    return next;
  }, [packageItems]);

  const defaultPrices = useMemo(() => {
    const next: Record<number, string> = {};
    for (const item of packageItems) {
      next[item.itemId] = Number(item.price).toFixed(2);
    }
    return next;
  }, [packageItems]);

  const packageCurrencies = useMemo(
    () => [
      ...new Set(
        packageItems
          .map((item) => item.currencyId)
          .filter((id): id is number => id !== null),
      ),
    ],
    [packageItems],
  );
  const mixedCurrencies = packageCurrencies.length > 1;

  const defaultCurrencyId = useMemo(() => {
    if (packageCurrencies.length === 1) {
      return String(packageCurrencies[0]);
    }
    return currencies.length > 0 ? String(currencies[0].id) : "";
  }, [packageCurrencies, currencies]);

  const selected =
    selectedOverride && selectedOverride.key === packageKey
      ? selectedOverride.value
      : defaultSelected;
  const prices =
    pricesOverride && pricesOverride.key === packageKey
      ? pricesOverride.value
      : defaultPrices;
  const enabled =
    enabledOverride && enabledOverride.key === packageKey
      ? enabledOverride.value
      : true;
  const effectiveCurrencyId =
    currencyOverride && currencyOverride.key === packageKey
      ? currencyOverride.value
      : defaultCurrencyId;
  const effectiveCurrency = currencies.find(
    (c) => String(c.id) === effectiveCurrencyId,
  );

  const total = useMemo(() => {
    let sum = 0;
    for (const item of packageItems) {
      if (selected[item.itemId] ?? true) {
        const price = Number(prices[item.itemId] ?? item.price);
        if (Number.isFinite(price) && price > 0) {
          sum += Math.round(price * 100) / 100;
        }
      }
    }
    return Math.round(sum * 100) / 100;
  }, [packageItems, selected, prices]);

  useEffect(() => {
    if (
      !canFetch ||
      !preview ||
      !preview.package ||
      !packageKey ||
      mixedCurrencies
    ) {
      onChange(null);
      return;
    }
    const items = packageItems
      .filter((item) => selected[item.itemId] ?? true)
      .map((item) => {
        const override = Number(prices[item.itemId] ?? item.price);
        const packagePrice = Number(item.price);
        return {
          itemId: item.itemId,
          unitPrice:
            Number.isFinite(override) &&
            Math.round(override * 100) !== Math.round(packagePrice * 100)
              ? Math.round(override * 100) / 100
              : undefined,
          quantity: 1,
        };
      });
    onChange({
      enabled,
      currencyId: effectiveCurrencyId ? Number(effectiveCurrencyId) : null,
      items,
    });
  }, [
    canFetch,
    preview,
    packageKey,
    packageItems,
    selected,
    prices,
    enabled,
    effectiveCurrencyId,
    mixedCurrencies,
    onChange,
  ]);

  if (!canFetch) {
    return null;
  }

  function toggleItem(itemId: number, value: boolean) {
    if (!packageKey) {
      return;
    }
    const current =
      selectedOverride && selectedOverride.key === packageKey
        ? selectedOverride.value
        : defaultSelected;
    setSelectedOverride({ key: packageKey, value: { ...current, [itemId]: value } });
  }

  function changePrice(itemId: number, value: string) {
    if (!packageKey) {
      return;
    }
    const current =
      pricesOverride && pricesOverride.key === packageKey
        ? pricesOverride.value
        : defaultPrices;
    setPricesOverride({ key: packageKey, value: { ...current, [itemId]: value } });
  }

  return (
    <div className="space-y-4 rounded-2xl border border-border bg-stone-50/60 p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-foreground">
          Registration invoice
        </h2>
        {preview?.package ? (
          <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(event) => {
                if (packageKey) {
                  setEnabledOverride({
                    key: packageKey,
                    value: event.target.checked,
                  });
                }
              }}
              className="h-4 w-4 accent-primary"
            />
            Create invoice with registration
          </label>
        ) : null}
      </div>

      {isLoading || isFetching ? (
        <LoadingDots label="Loading registration package" />
      ) : error ? (
        <p className="text-sm text-red-600" role="alert">
          {getApiErrorMessage(error, "Could not load registration package")}
        </p>
      ) : !preview?.package ? (
        <p className="text-sm text-muted">
          No registration package is assigned to this class. The registration
          can still be saved without an invoice.
        </p>
      ) : (
        <div className="space-y-4">
          {preview.parent ? (
            <div className="grid gap-2 text-sm sm:grid-cols-2">
              <p>
                <span className="text-muted">Parent: </span>
                <span className="font-medium text-foreground">
                  {preview.parent.parentName}
                </span>
              </p>
              <p>
                <span className="text-muted">Account: </span>
                <span className="font-medium text-foreground">
                  {preview.parent.hasAccountingAccount
                    ? `${preview.parent.accountCode} — ${preview.parent.parentName}`
                    : "Will be created automatically"}
                </span>
              </p>
            </div>
          ) : (
            <p className="text-sm text-red-600" role="alert">
              The selected student has no parent assigned, an invoice cannot be
              created.
            </p>
          )}
          <p className="text-sm">
            <span className="text-muted">Package: </span>
            <span className="font-medium text-foreground">
              {preview.package.name}
            </span>
          </p>
          {mixedCurrencies ? (
            <p className="text-sm text-red-600" role="alert">
              Package items use different currencies. Invoices cannot mix
              currencies — save the registration without an invoice or fix the
              package first.
            </p>
          ) : null}
          <ul className="space-y-2">
            {packageItems.map((item) => {
              const checked = selected[item.itemId] ?? true;
              return (
                <li
                  key={item.itemId}
                  className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-white px-3 py-2.5"
                >
                  <input
                    type="checkbox"
                    aria-label={`Include ${item.itemName}`}
                    checked={checked}
                    onChange={(event) =>
                      toggleItem(item.itemId, event.target.checked)
                    }
                    className="h-4 w-4 accent-primary"
                  />
                  <span className="min-w-0 flex-1 text-sm font-medium text-foreground">
                    {item.itemName}
                  </span>
                  <input
                    aria-label={`${item.itemName} price`}
                    type="number"
                    min="0"
                    step="0.01"
                    value={prices[item.itemId] ?? item.price}
                    onChange={(event) =>
                      changePrice(item.itemId, event.target.value)
                    }
                    className="h-10 w-28 rounded-lg border border-border bg-white px-2 text-sm"
                  />
                  <span className="text-sm text-muted">
                    {item.currency?.shortCode ??
                      effectiveCurrency?.shortCode ??
                      ""}
                  </span>
                </li>
              );
            })}
          </ul>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <label className="flex items-center gap-2 text-sm">
              <span className="text-muted">Currency</span>
              <select
                value={effectiveCurrencyId}
                onChange={(event) => {
                  if (packageKey) {
                    setCurrencyOverride({
                      key: packageKey,
                      value: event.target.value,
                    });
                  }
                }}
                className="h-10 rounded-lg border border-border bg-white px-2 text-sm"
              >
                {currencies.map((currency) => (
                  <option key={currency.id} value={currency.id}>
                    {currency.symbol} / {currency.shortCode}
                  </option>
                ))}
              </select>
            </label>
            <p className="text-sm font-semibold text-foreground" role="status">
              Total: {total.toFixed(2)} {effectiveCurrency?.shortCode ?? ""}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
