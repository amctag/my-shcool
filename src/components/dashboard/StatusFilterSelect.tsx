"use client";

import { FilterSelect } from "@/components/dashboard/FilterSelect";
import type { PersonStatusFilter } from "@/features/school/types";

const STATUS_OPTIONS: { value: PersonStatusFilter; label: string }[] = [
  { value: "all", label: "All statuses" },
  { value: "active", label: "Active" },
  { value: "closed", label: "Closed" },
];

export function StatusFilterSelect({
  value,
  onChange,
}: {
  value: PersonStatusFilter;
  onChange: (status: PersonStatusFilter) => void;
}) {
  return (
    <FilterSelect
      label="Filter by status"
      value={value}
      options={STATUS_OPTIONS}
      onChange={onChange}
    />
  );
}
