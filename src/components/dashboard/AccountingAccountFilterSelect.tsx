"use client";

import { FilterSelect } from "@/components/dashboard/FilterSelect";
import type { AccountingAccountFilter } from "@/features/school/types";

const ACCOUNT_OPTIONS: { value: AccountingAccountFilter; label: string }[] = [
  { value: "all", label: "All accounts" },
  { value: "hasAccount", label: "Has Account" },
  { value: "noAccount", label: "No Account" },
];

export function AccountingAccountFilterSelect({
  value,
  onChange,
}: {
  value: AccountingAccountFilter;
  onChange: (status: AccountingAccountFilter) => void;
}) {
  return (
    <FilterSelect
      label="Filter by accounting account"
      value={value}
      options={ACCOUNT_OPTIONS}
      onChange={onChange}
    />
  );
}
