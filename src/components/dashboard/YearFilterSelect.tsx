"use client";

import { FilterSelect } from "@/components/dashboard/FilterSelect";
import type { DashboardYear } from "@/features/school/types";

export function YearFilterSelect({
  years,
  value,
  onChange,
  disabled,
}: {
  years: DashboardYear[];
  value: number | null;
  onChange: (yearId: number) => void;
  disabled?: boolean;
}) {
  return (
    <FilterSelect
      label="Filter by year"
      value={value}
      disabled={disabled || years.length === 0}
      options={
        years.length === 0
          ? [{ value: 0, label: "No years" }]
          : years.map((year) => ({
              value: year.id,
              label: year.isCurrent ? `${year.title} (current)` : year.title,
            }))
      }
      onChange={onChange}
    />
  );
}
