"use client";

import { useEffect } from "react";
import { Check, X } from "lucide-react";

export type ScheduleCourseOption = {
  courseId: number;
  courseTitle: string;
};

export function ScheduleCourseDrawer({
  dayName,
  sessionLabel,
  courses,
  selectedCourseId,
  onSelectCourse,
  onSave,
  onClose,
}: {
  dayName: string;
  sessionLabel: string;
  courses: ScheduleCourseOption[];
  selectedCourseId: number;
  onSelectCourse: (courseId: number) => void;
  onSave: () => void;
  onClose: () => void;
}) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <button
        type="button"
        aria-label="Close course picker"
        className="absolute inset-0 cursor-pointer bg-black/40"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="schedule-course-drawer-title"
        className="relative z-10 flex max-h-[90dvh] w-full max-w-md flex-col overflow-hidden rounded-3xl bg-white shadow-xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-stone-100 px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              Choose course
            </p>
            <h2
              id="schedule-course-drawer-title"
              className="mt-1 text-xl font-semibold text-foreground"
            >
              {dayName} · Period {sessionLabel}
            </h2>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="inline-flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full hover:bg-primary-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <X aria-hidden className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <ul className="space-y-2">
            <li>
              <button
                type="button"
                onClick={() => onSelectCourse(0)}
                className={`flex min-h-11 w-full cursor-pointer items-center justify-between rounded-xl border px-4 text-left text-sm transition-colors ${
                  selectedCourseId === 0
                    ? "border-primary bg-primary-soft font-medium text-primary"
                    : "border-border bg-white text-foreground hover:border-primary/40 hover:bg-primary-soft/60"
                }`}
              >
                <span>Empty slot</span>
                {selectedCourseId === 0 ? (
                  <Check aria-hidden className="h-4 w-4" />
                ) : null}
              </button>
            </li>
            {courses.map((course) => {
              const selected = selectedCourseId === course.courseId;
              return (
                <li key={course.courseId}>
                  <button
                    type="button"
                    onClick={() => onSelectCourse(course.courseId)}
                    className={`flex min-h-11 w-full cursor-pointer items-center justify-between rounded-xl border px-4 text-left text-sm transition-colors ${
                      selected
                        ? "border-primary bg-primary-soft font-medium text-primary"
                        : "border-border bg-white text-foreground hover:border-primary/40 hover:bg-primary-soft/60"
                    }`}
                  >
                    <span>{course.courseTitle}</span>
                    {selected ? (
                      <Check aria-hidden className="h-4 w-4" />
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="flex gap-3 border-t border-stone-100 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-11 flex-1 cursor-pointer items-center justify-center rounded-xl border border-border text-sm font-medium hover:bg-primary-soft"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSave}
            className="inline-flex h-11 flex-1 cursor-pointer items-center justify-center rounded-xl bg-primary text-sm font-medium text-on-primary hover:bg-primary-hover"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
