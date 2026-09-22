"use client";

import { useEffect } from "react";
import { useGetYearsQuery } from "@/features/school/api/sectionsApi";
import {
  clearSelectedYearId,
  schoolYearStorageKey,
  selectSelectedYearId,
  setSelectedYearId,
} from "@/features/school/schoolYearSlice";
import {
  selectAuthReady,
  selectSchoolId,
} from "@/features/auth/authSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";

function readStoredYearId(schoolId: number): number | null {
  if (typeof window === "undefined") {
    return null;
  }
  const raw = window.localStorage.getItem(schoolYearStorageKey(schoolId));
  if (!raw) {
    return null;
  }
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function writeStoredYearId(schoolId: number, yearId: number) {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(schoolYearStorageKey(schoolId), String(yearId));
}

export function useSchoolYearFilter(canFetch: boolean) {
  const dispatch = useAppDispatch();
  const authReady = useAppSelector(selectAuthReady);
  const schoolId = useAppSelector(selectSchoolId);
  const yearId = useAppSelector(selectSelectedYearId);
  const shouldFetch = canFetch && authReady;
  const { data: years = [], isLoading } = useGetYearsQuery(undefined, {
    skip: !shouldFetch,
  });

  useEffect(() => {
    if (!schoolId) {
      if (yearId != null) {
        dispatch(clearSelectedYearId());
      }
      return;
    }

    if (!shouldFetch || years.length === 0) {
      return;
    }

    if (yearId != null && years.some((year) => year.id === yearId)) {
      return;
    }

    const storedId = readStoredYearId(schoolId);
    if (storedId != null && years.some((year) => year.id === storedId)) {
      dispatch(setSelectedYearId(storedId));
      return;
    }

    const current = years.find((year) => year.isCurrent) ?? years[0];
    dispatch(setSelectedYearId(current.id));
    writeStoredYearId(schoolId, current.id);
  }, [dispatch, schoolId, shouldFetch, yearId, years]);

  function setYearId(nextYearId: number) {
    dispatch(setSelectedYearId(nextYearId));
    if (schoolId) {
      writeStoredYearId(schoolId, nextYearId);
    }
  }

  return { years, yearId, setYearId, isLoading };
}
