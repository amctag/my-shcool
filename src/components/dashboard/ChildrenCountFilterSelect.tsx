"use client";

import { FilterSelect } from "@/components/dashboard/FilterSelect";
import type { ChildrenCountFilter } from "@/features/school/types";

const CHILDREN_COUNT_OPTIONS: {
  value: ChildrenCountFilter;
  label: string;
}[] = [
  { value: "all", label: "All children" },
  { value: "0", label: "0 children" },
  { value: "1", label: "1 child" },
  { value: "2", label: "2 children" },
  { value: "3", label: "3 children" },
  { value: "4", label: "4 children" },
  { value: "5", label: "5 children" },
  { value: "6+", label: "6+ children" },
];

export function ChildrenCountFilterSelect({
  value,
  onChange,
}: {
  value: ChildrenCountFilter;
  onChange: (count: ChildrenCountFilter) => void;
}) {
  return (
    <FilterSelect
      label="Filter by children count"
      value={value || "all"}
      options={CHILDREN_COUNT_OPTIONS}
      onChange={onChange}
    />
  );
}
