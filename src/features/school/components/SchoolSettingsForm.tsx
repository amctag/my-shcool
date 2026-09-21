"use client";

import { useState } from "react";
import { LoadingDots } from "@/components/dashboard/TableLoading";
import { getApiErrorMessage } from "@/lib/getApiErrorMessage";
import {
  useGetSchoolSettingsQuery,
  useUpdateSchoolSettingsMutation,
} from "@/features/school/api/schoolSettingsApi";
import { selectAccessToken, selectAuthReady } from "@/features/auth/authSlice";
import { useAppSelector } from "@/store/hooks";

function SettingSwitch({
  enabled,
  disabled,
  label,
  onToggle,
}: {
  enabled: boolean;
  disabled: boolean;
  label: string;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      aria-label={label}
      disabled={disabled}
      onClick={onToggle}
      className={`relative inline-flex h-8 w-14 shrink-0 cursor-pointer rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-60 ${
        enabled ? "bg-emerald-600" : "bg-zinc-300"
      }`}
    >
      <span
        aria-hidden
        className={`pointer-events-none mt-1 inline-block h-6 w-6 rounded-full bg-white shadow transition-transform ${
          enabled ? "translate-x-7" : "translate-x-1"
        }`}
      />
    </button>
  );
}

export function SchoolSettingsForm() {
  const ready = useAppSelector(selectAuthReady);
  const accessToken = useAppSelector(selectAccessToken);
  const canFetch = ready && Boolean(accessToken);
  const { data, isLoading, isError, error, refetch } = useGetSchoolSettingsQuery(
    undefined,
    { skip: !canFetch },
  );
  const [updateSettings, updateState] = useUpdateSchoolSettingsMutation();
  const [saveError, setSaveError] = useState<string | null>(null);

  async function patch(
    body: Partial<{
      teachersSeeAllClassCourses: boolean;
      attendancePerCourse: boolean;
      teachersCanPublishAgenda: boolean;
      teachersCanPublishGrades: boolean;
    }>,
  ) {
    setSaveError(null);
    try {
      await updateSettings(body).unwrap();
    } catch (caught) {
      setSaveError(
        getApiErrorMessage(caught, "Could not update school settings"),
      );
    }
  }

  if (!canFetch || isLoading) {
    return <LoadingDots label="Loading settings" />;
  }

  if (isError || !data) {
    return (
      <div className="rounded-2xl border border-border bg-white p-6">
        <p className="text-sm text-red-600">
          {getApiErrorMessage(error, "Could not load school settings")}
        </p>
        <button
          type="button"
          onClick={() => void refetch()}
          className="mt-4 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {saveError ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {saveError}
        </p>
      ) : null}
      <article className="rounded-2xl border border-border bg-white p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-xl">
            <h2 className="text-lg font-semibold text-foreground">
              Teacher class courses
            </h2>
            <p className="mt-1 text-sm text-muted">
              When this is on, a teacher can see every course on a class
              timetable and the other teachers on that class. When it is off,
              teachers only see the courses they teach.
            </p>
          </div>
          <SettingSwitch
            enabled={data.teachersSeeAllClassCourses}
            disabled={updateState.isLoading}
            label="Teachers can see other courses in a class"
            onToggle={() =>
              void patch({
                teachersSeeAllClassCourses: !data.teachersSeeAllClassCourses,
              })
            }
          />
        </div>
        <p className="mt-4 text-sm font-medium text-foreground">
          {data.teachersSeeAllClassCourses
            ? "Teachers can see all courses in a class"
            : "Teachers only see their own courses"}
        </p>
      </article>
      <article className="rounded-2xl border border-border bg-white p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-xl">
            <h2 className="text-lg font-semibold text-foreground">
              Attendance by course
            </h2>
            <p className="mt-1 text-sm text-muted">
              Off: one attendance for the class, taken by the teacher of the
              first session that day. On: each course teacher takes attendance
              for their own course.
            </p>
          </div>
          <SettingSwitch
            enabled={data.attendancePerCourse}
            disabled={updateState.isLoading}
            label="Take attendance per course"
            onToggle={() =>
              void patch({
                attendancePerCourse: !data.attendancePerCourse,
              })
            }
          />
        </div>
        <p className="mt-4 text-sm font-medium text-foreground">
          {data.attendancePerCourse
            ? "Each course teacher takes attendance"
            : "First-session teacher takes class attendance"}
        </p>
      </article>
      <article className="rounded-2xl border border-border bg-white p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-xl">
            <h2 className="text-lg font-semibold text-foreground">
              Teachers publish agenda
            </h2>
            <p className="mt-1 text-sm text-muted">
              When this is on, teachers can publish agenda items so parents see
              them. When it is off, teachers only save drafts and the school
              publishes the agenda from the dashboard.
            </p>
          </div>
          <SettingSwitch
            enabled={data.teachersCanPublishAgenda}
            disabled={updateState.isLoading}
            label="Teachers can publish agenda"
            onToggle={() =>
              void patch({
                teachersCanPublishAgenda: !data.teachersCanPublishAgenda,
              })
            }
          />
        </div>
        <p className="mt-4 text-sm font-medium text-foreground">
          {data.teachersCanPublishAgenda
            ? "Teachers can publish agenda items"
            : "School publishes agenda items"}
        </p>
      </article>
      <article className="rounded-2xl border border-border bg-white p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-xl">
            <h2 className="text-lg font-semibold text-foreground">
              Teachers publish grades
            </h2>
            <p className="mt-1 text-sm text-muted">
              When this is on, teachers can publish grades so parents see them.
              When it is off, teachers only save drafts and class supervisors
              can publish.
            </p>
          </div>
          <SettingSwitch
            enabled={data.teachersCanPublishGrades}
            disabled={updateState.isLoading}
            label="Teachers can publish grades"
            onToggle={() =>
              void patch({
                teachersCanPublishGrades: !data.teachersCanPublishGrades,
              })
            }
          />
        </div>
        <p className="mt-4 text-sm font-medium text-foreground">
          {data.teachersCanPublishGrades
            ? "Teachers can publish grades"
            : "Supervisors publish grades"}
        </p>
      </article>
    </div>
  );
}
