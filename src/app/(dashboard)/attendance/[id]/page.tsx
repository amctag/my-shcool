"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Check, Pencil, Trash2 } from "lucide-react";
import { ConfirmDeleteDialog } from "@/components/dashboard/ConfirmDeleteDialog";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { LoadingDots } from "@/components/dashboard/TableLoading";
import { getApiErrorMessage } from "@/lib/getApiErrorMessage";
import {
  useDeleteAttendanceMutation,
  useGetAttendanceQuery,
} from "@/features/school/api/attendancesApi";
import { selectAuthReady, selectAccessToken } from "@/features/auth/authSlice";
import { useAppSelector } from "@/store/hooks";

export default function AttendanceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);
  const ready = useAppSelector(selectAuthReady);
  const accessToken = useAppSelector(selectAccessToken);
  const canFetch = ready && Boolean(accessToken) && id > 0;

  const [confirmRemove, setConfirmRemove] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const { data, error, isLoading } = useGetAttendanceQuery(id, {
    skip: !canFetch,
  });
  const [deleteAttendance, deleteState] = useDeleteAttendanceMutation();

  async function handleRemove() {
    try {
      await deleteAttendance(id).unwrap();
      router.push("/attendance");
    } catch (err) {
      setDeleteError(getApiErrorMessage(err, "Could not remove attendance"));
    }
  }

  return (
    <div className="space-y-4">
      <Link
        href="/attendance"
        className="inline-flex min-h-11 items-center text-sm font-medium text-primary hover:text-primary-hover"
      >
        Back to attendance
      </Link>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          title="Attendance details"
          description={
            data
              ? `${data.className}/${data.sectionTitle} · ${data.yearTitle} · ${data.date}`
              : "Student present / absent for this day"
          }
        />
        {data ? (
          <div className="flex shrink-0 gap-2">
            <Link
              href={`/attendance/${id}/edit`}
              className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-lg border border-border bg-white px-4 text-sm font-medium text-foreground transition-colors hover:bg-primary-soft hover:text-primary"
            >
              <Pencil aria-hidden className="h-4 w-4" />
              Edit
            </Link>
            <button
              type="button"
              onClick={() => {
                setDeleteError(null);
                setConfirmRemove(true);
              }}
              className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-lg border border-border bg-white px-4 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
            >
              <Trash2 aria-hidden className="h-4 w-4" />
              Remove
            </button>
          </div>
        ) : null}
      </div>

      {isLoading ? (
        <div className="rounded-2xl bg-white px-5 py-16 text-center shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <LoadingDots label="Loading attendance" />
        </div>
      ) : null}

      {error ? (
        <p className="text-sm text-red-600" role="alert">
          {getApiErrorMessage(error, "Could not load attendance")}
        </p>
      ) : null}

      {data ? (
        <div className="overflow-hidden rounded-2xl bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <ul className="divide-y divide-stone-100">
            {data.students.map((student) => {
              const isPresent = student.status === "present";
              return (
                <li
                  key={student.studentId}
                  className="flex flex-col gap-2 px-5 py-4 odd:bg-white even:bg-primary-soft/40 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-foreground">
                      {student.studentName}
                    </p>
                    {!isPresent ? (
                      <div className="mt-1 space-y-0.5 text-sm text-muted">
                        {student.attendanceReasonTitle ? (
                          <p>Reason: {student.attendanceReasonTitle}</p>
                        ) : null}
                        {student.description ? (
                          <p>Description: {student.description}</p>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                  <span
                    className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                      isPresent ? "bg-[#4caf50]" : "bg-[#ff6a00]"
                    }`}
                    title={isPresent ? "Present" : "Absent"}
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
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}

      {confirmRemove ? (
        <ConfirmDeleteDialog
          title="Remove attendance?"
          description="This attendance record will be removed."
          confirmLabel={deleteState.isLoading ? "Removing…" : "Remove"}
          busy={deleteState.isLoading}
          error={deleteError}
          onCancel={() => {
            setConfirmRemove(false);
            setDeleteError(null);
          }}
          onConfirm={() => void handleRemove()}
        />
      ) : null}
    </div>
  );
}
