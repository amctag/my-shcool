"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { FilterSelect } from "@/components/dashboard/FilterSelect";
import { LoadingDots } from "@/components/dashboard/TableLoading";
import { YearFilterSelect } from "@/components/dashboard/YearFilterSelect";
import { getApiErrorMessage } from "@/lib/getApiErrorMessage";
import { useGetAttendanceReasonsQuery } from "@/features/school/api/attendanceReasonsApi";
import {
  useGetAttendanceQuery,
  useLazyGetAttendanceSheetQuery,
  useSaveAttendanceMutation,
} from "@/features/school/api/attendancesApi";
import { useGetClassesQuery } from "@/features/school/api/classesApi";
import { useGetSectionsQuery } from "@/features/school/api/sectionsApi";
import { useSchoolYearFilter } from "@/features/school/useSchoolYearFilter";
import { selectAuthReady, selectAccessToken } from "@/features/auth/authSlice";
import { useAppSelector } from "@/store/hooks";
import type { AttendanceStudentStatus } from "@/features/school/types";

type StudentRowState = {
  studentId: number;
  registrationId: number;
  studentName: string;
  status: AttendanceStudentStatus;
  attendanceReasonId: number;
  description: string;
};

function todayIsoDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const inputClass =
  "h-11 w-full rounded-xl border border-border bg-white px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted/80 focus:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

type TakeAttendanceFormProps = {
  attendanceId?: number;
};

export function TakeAttendanceForm({ attendanceId }: TakeAttendanceFormProps) {
  const router = useRouter();
  const isEdit = attendanceId != null && attendanceId > 0;
  const ready = useAppSelector(selectAuthReady);
  const accessToken = useAppSelector(selectAccessToken);
  const canFetch = ready && Boolean(accessToken);
  const { years, yearId: defaultYearId } = useSchoolYearFilter(canFetch);

  const [yearId, setYearId] = useState<number | null>(null);
  const [classId, setClassId] = useState(0);
  const [sectionId, setSectionId] = useState(0);
  const [date, setDate] = useState(todayIsoDate);
  const [rows, setRows] = useState<StudentRowState[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [sheetMeta, setSheetMeta] = useState<{
    className: string;
    sectionTitle: string;
    yearTitle: string;
  } | null>(null);
  const [editHydrated, setEditHydrated] = useState(false);

  const resolvedYearId = yearId ?? defaultYearId;

  const { data: classesData } = useGetClassesQuery(
    { page: 1, limit: 100, sortOrder: "asc" },
    { skip: !canFetch || isEdit },
  );
  const { data: sectionsData } = useGetSectionsQuery(
    {
      page: 1,
      limit: 100,
      yearId: resolvedYearId ?? undefined,
      classId: classId || undefined,
    },
    { skip: !canFetch || isEdit || !resolvedYearId || !classId },
  );
  const { data: reasons = [] } = useGetAttendanceReasonsQuery(
    { activeOnly: true },
    { skip: !canFetch },
  );

  const {
    data: existing,
    error: existingError,
    isLoading: existingLoading,
  } = useGetAttendanceQuery(attendanceId ?? 0, {
    skip: !canFetch || !isEdit,
  });

  const [loadSheet, sheetState] = useLazyGetAttendanceSheetQuery();
  const [saveAttendance, saveState] = useSaveAttendanceMutation();

  const classes = classesData?.items ?? [];
  const sections = sectionsData?.items ?? [];

  useEffect(() => {
    if (defaultYearId && yearId == null && !isEdit) {
      setYearId(defaultYearId);
    }
  }, [defaultYearId, yearId, isEdit]);

  useEffect(() => {
    if (!existing || editHydrated) {
      return;
    }
    setClassId(existing.classId);
    setSectionId(existing.sectionId);
    setDate(existing.date);
    setYearId(existing.yearId);
    setSheetMeta({
      className: existing.className,
      sectionTitle: existing.sectionTitle,
      yearTitle: existing.yearTitle,
    });
    setRows(
      existing.students.map((student) => ({
        studentId: student.studentId,
        registrationId: student.registrationId,
        studentName: student.studentName,
        status: student.status === "absent" ? "absent" : "present",
        attendanceReasonId: student.attendanceReasonId ?? 0,
        description: student.description ?? "",
      })),
    );
    setEditHydrated(true);
  }, [existing, editHydrated]);

  const canLoadSheet = sectionId > 0 && Boolean(date);

  async function handleLoadStudents() {
    setFormError(null);
    if (!canLoadSheet) {
      setFormError("Select class, section, and date first.");
      return;
    }
    try {
      const sheet = await loadSheet({ sectionId, date }).unwrap();
      setSheetMeta({
        className: sheet.className,
        sectionTitle: sheet.sectionTitle,
        yearTitle: sheet.yearTitle,
      });
      setRows(
        sheet.students.map((student) => ({
          studentId: student.studentId,
          registrationId: student.registrationId,
          studentName: student.studentName,
          status: student.status === "absent" ? "absent" : "present",
          attendanceReasonId: student.attendanceReasonId ?? 0,
          description: student.description ?? "",
        })),
      );
      if (sheet.students.length === 0) {
        setFormError("No registered students in this section.");
      }
    } catch (caught) {
      setRows([]);
      setSheetMeta(null);
      setFormError(getApiErrorMessage(caught, "Could not load students"));
    }
  }

  function toggleStatus(studentId: number) {
    setRows((current) =>
      current.map((row) => {
        if (row.studentId !== studentId) {
          return row;
        }
        const nextStatus: AttendanceStudentStatus =
          row.status === "present" ? "absent" : "present";
        return {
          ...row,
          status: nextStatus,
          attendanceReasonId:
            nextStatus === "present" ? 0 : row.attendanceReasonId,
          description: nextStatus === "present" ? "" : row.description,
        };
      }),
    );
  }

  function setReasonId(studentId: number, attendanceReasonId: number) {
    setRows((current) =>
      current.map((row) =>
        row.studentId === studentId ? { ...row, attendanceReasonId } : row,
      ),
    );
  }

  function setDescription(studentId: number, description: string) {
    setRows((current) =>
      current.map((row) =>
        row.studentId === studentId ? { ...row, description } : row,
      ),
    );
  }

  const absentWithoutReason = useMemo(
    () =>
      rows.some(
        (row) => row.status === "absent" && !(row.attendanceReasonId > 0),
      ),
    [rows],
  );

  async function handleSave() {
    setFormError(null);
    if (rows.length === 0) {
      setFormError("Load students before saving.");
      return;
    }
    if (absentWithoutReason) {
      setFormError("Choose a reason for every absent student.");
      return;
    }
    try {
      await saveAttendance({
        sectionId,
        date,
        details: rows.map((row) => ({
          studentId: row.studentId,
          status: row.status,
          attendanceReasonId:
            row.status === "absent" ? row.attendanceReasonId : null,
          description:
            row.status === "absent" ? row.description.trim() || null : null,
        })),
      }).unwrap();
      router.push("/attendance?saved=1");
    } catch (caught) {
      setFormError(getApiErrorMessage(caught, "Could not save attendance"));
    }
  }

  if (isEdit && existingLoading) {
    return (
      <div className="rounded-2xl bg-white px-5 py-16 text-center shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <LoadingDots label="Loading attendance" />
      </div>
    );
  }

  if (isEdit && existingError) {
    return (
      <p className="text-sm text-red-600" role="alert">
        {getApiErrorMessage(existingError, "Could not load attendance")}
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {isEdit ? (
        <p className="text-sm text-muted">
          {sheetMeta?.className}/{sheetMeta?.sectionTitle} ·{" "}
          {sheetMeta?.yearTitle} · {date}
        </p>
      ) : (
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex min-w-0 flex-1 flex-wrap items-end gap-2">
            <div className="min-w-[9rem] flex-1 sm:max-w-[11rem]">
              <YearFilterSelect
                years={years}
                value={resolvedYearId}
                onChange={(value) => {
                  setYearId(value);
                  setSectionId(0);
                  setRows([]);
                  setSheetMeta(null);
                }}
              />
            </div>
            <div className="min-w-[9rem] flex-1 sm:max-w-[11rem]">
              <FilterSelect
                label="Class"
                value={classId}
                options={[
                  { value: 0, label: "Select class" },
                  ...classes.map((item) => ({
                    value: item.id,
                    label: item.className,
                  })),
                ]}
                onChange={(value) => {
                  setClassId(value);
                  setSectionId(0);
                  setRows([]);
                  setSheetMeta(null);
                }}
              />
            </div>
            <div className="min-w-[9rem] flex-1 sm:max-w-[11rem]">
              <FilterSelect
                label="Section"
                value={sectionId}
                options={[
                  { value: 0, label: "Select section" },
                  ...sections.map((item) => ({
                    value: item.id,
                    label: item.sectionTitle,
                  })),
                ]}
                onChange={(value) => {
                  setSectionId(value);
                  setRows([]);
                  setSheetMeta(null);
                }}
              />
            </div>
            <label className="flex min-w-[9rem] flex-1 flex-col gap-1.5 text-sm sm:max-w-[11rem]">
              <span className="font-medium text-foreground">Date</span>
              <input
                type="date"
                className={inputClass}
                value={date}
                onChange={(event) => {
                  setDate(event.target.value);
                  setRows([]);
                  setSheetMeta(null);
                }}
              />
            </label>
            <button
              type="button"
              onClick={() => void handleLoadStudents()}
              disabled={!canLoadSheet || sheetState.isFetching}
              className="inline-flex h-11 shrink-0 cursor-pointer items-center justify-center rounded-lg bg-foreground px-4 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
            >
              {sheetState.isFetching ? "Loading…" : "Load"}
            </button>
          </div>
        </div>
      )}

      {!isEdit && sheetMeta ? (
        <p className="text-sm text-muted">
          {sheetMeta.className}/{sheetMeta.sectionTitle} · {sheetMeta.yearTitle}{" "}
          · {date}
        </p>
      ) : null}

      {formError ? (
        <p className="text-sm text-red-600" role="alert">
          {formError}
        </p>
      ) : null}

      {reasons.length === 0 ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          No active attendance reasons yet.{" "}
          <Link
            href="/attendance/reasons/add"
            className="font-medium underline underline-offset-2"
          >
            Add a reason
          </Link>{" "}
          before marking students absent.
        </p>
      ) : null}

      <div className="overflow-hidden rounded-2xl bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        {sheetState.isFetching && rows.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <LoadingDots label="Loading students" />
          </div>
        ) : rows.length === 0 ? (
          <p className="px-5 py-16 text-center text-sm text-muted">
            {isEdit
              ? "No students on this attendance record."
              : "Choose year, class, section, and date, then load students."}
          </p>
        ) : (
          <ul className="divide-y divide-stone-100">
            {rows.map((row) => {
              const isPresent = row.status === "present";
              return (
                <li
                  key={row.studentId}
                  className="flex flex-col gap-3 px-5 py-4 odd:bg-white even:bg-primary-soft/40 sm:flex-row sm:items-start sm:justify-between"
                >
                  <div className="min-w-0 flex-1 space-y-2">
                    <p className="font-medium text-foreground">
                      {row.studentName}
                    </p>
                    {!isPresent ? (
                      <div className="grid max-w-xl gap-2 sm:grid-cols-2">
                        <label className="block text-sm">
                          <span className="mb-1.5 block font-medium text-foreground">
                            Reason *
                          </span>
                          <select
                            value={row.attendanceReasonId}
                            onChange={(event) =>
                              setReasonId(
                                row.studentId,
                                Number(event.target.value),
                              )
                            }
                            aria-label={`Absence reason for ${row.studentName}`}
                            className={`${inputClass} cursor-pointer`}
                          >
                            <option value={0}>Select reason</option>
                            {reasons.map((reason) => (
                              <option key={reason.id} value={reason.id}>
                                {reason.title}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="block text-sm">
                          <span className="mb-1.5 block font-medium text-foreground">
                            Description
                          </span>
                          <input
                            type="text"
                            value={row.description}
                            onChange={(event) =>
                              setDescription(
                                row.studentId,
                                event.target.value,
                              )
                            }
                            placeholder="Optional details"
                            aria-label={`Absence description for ${row.studentName}`}
                            className={inputClass}
                          />
                        </label>
                      </div>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleStatus(row.studentId)}
                    aria-pressed={isPresent}
                    aria-label={
                      isPresent
                        ? `${row.studentName} present — click to mark absent`
                        : `${row.studentName} absent — click to mark present`
                    }
                    className={`inline-flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${
                      isPresent
                        ? "bg-[#4caf50] hover:bg-[#43a047]"
                        : "bg-[#ff6a00] hover:bg-[#e85f00]"
                    }`}
                  >
                    {isPresent ? (
                      <Check
                        className="h-5 w-5 text-white"
                        strokeWidth={3}
                        aria-hidden
                      />
                    ) : (
                      <span
                        className="h-3 w-3 rounded-full bg-white"
                        aria-hidden
                      />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {rows.length > 0 ? (
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() =>
              router.push(
                isEdit && attendanceId
                  ? `/attendance/${attendanceId}`
                  : "/attendance",
              )
            }
            className="inline-flex h-11 cursor-pointer items-center justify-center rounded-xl border border-border bg-white px-5 text-sm font-medium text-foreground hover:bg-stone-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saveState.isLoading || absentWithoutReason}
            className="inline-flex h-11 cursor-pointer items-center justify-center rounded-xl bg-primary px-5 text-sm font-medium text-on-primary hover:bg-primary-hover disabled:opacity-50"
          >
            {saveState.isLoading
              ? "Saving…"
              : isEdit
                ? "Save changes"
                : "Save attendance"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
