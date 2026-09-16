"use client";

import { FilterSelect } from "@/components/dashboard/FilterSelect";
import type { PersonPaidFilter } from "@/features/school/types";

const PAID_OPTIONS: { value: PersonPaidFilter; label: string }[] = [
  { value: "all", label: "All payments" },
  { value: "paid", label: "Paid" },
  { value: "unpaid", label: "Unpaid" },
];

export function PaidFilterSelect({
  value,
  onChange,
}: {
  value: PersonPaidFilter;
  onChange: (paid: PersonPaidFilter) => void;
}) {
  return (
    <FilterSelect
      label="Filter by payment"
      value={value}
      options={PAID_OPTIONS}
      onChange={onChange}
    />
  );
}
