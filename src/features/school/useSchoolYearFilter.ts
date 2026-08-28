"use client";

import { useEffect, useState } from "react";
import { useGetYearsQuery } from "@/features/school/api/sectionsApi";

export function useSchoolYearFilter(canFetch: boolean) {
  const { data: years = [], isLoading } = useGetYearsQuery(undefined, {
    skip: !canFetch,
  });
  const [yearId, setYearId] = useState<number | null>(null);

  useEffect(() => {
    if (yearId != null || years.length === 0) {
      return;
    }
    const current = years.find((year) => year.isCurrent) ?? years[0];
    setYearId(current.id);
  }, [yearId, years]);

  return { years, yearId, setYearId, isLoading };
}
