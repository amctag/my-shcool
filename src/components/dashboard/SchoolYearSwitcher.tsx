"use client";

import { YearFilterSelect } from "@/components/dashboard/YearFilterSelect";
import { selectAuthReady, selectAccessToken } from "@/features/auth/authSlice";
import { useSchoolYearFilter } from "@/features/school/useSchoolYearFilter";
import { useAppSelector } from "@/store/hooks";

export function SchoolYearSwitcher() {
  const ready = useAppSelector(selectAuthReady);
  const accessToken = useAppSelector(selectAccessToken);
  const canFetch = ready && Boolean(accessToken);
  const { years, yearId, setYearId, isLoading } = useSchoolYearFilter(canFetch);

  if (!canFetch) {
    return null;
  }

  return (
    <div className="ms-auto min-w-[10rem] sm:min-w-[12rem]">
      <YearFilterSelect
        years={years}
        value={yearId}
        disabled={isLoading || years.length === 0}
        onChange={setYearId}
      />
    </div>
  );
}
