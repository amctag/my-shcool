"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { getApiErrorMessage } from "@/lib/getApiErrorMessage";
import { selectAuthReady } from "@/features/auth/authSlice";
import {
  useCreateAttendanceReasonMutation,
  useGetAttendanceReasonQuery,
  useUpdateAttendanceReasonMutation,
} from "@/features/school/api/attendanceReasonsApi";
import { useAppSelector } from "@/store/hooks";

const inputClass =
  "h-11 w-full rounded-xl border border-border bg-white px-3 text-sm text-foreground outline-none transition-colors duration-200 placeholder:text-muted/80 focus:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

type FormState = {
  title: string;
  status: string;
};

function emptyForm(): FormState {
  return { title: "", status: "true" };
}

function Field({
  id,
  label,
  required,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <label htmlFor={id} className="block min-w-0 flex-1">
      <span className="mb-1.5 block text-sm font-medium text-foreground">
        {label}
        {required ? " *" : ""}
      </span>
      {children}
    </label>
  );
}

export function AttendanceReasonForm({
  reasonId,
  readOnly = false,
}: {
  reasonId?: number;
  readOnly?: boolean;
}) {
  const router = useRouter();
  const authReady = useAppSelector(selectAuthReady);
  const isEdit = Boolean(reasonId) && !readOnly;
  const [form, setForm] = useState<FormState>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);

  const { data: item, isLoading } = useGetAttendanceReasonQuery(reasonId ?? 0, {
    skip: !authReady || !reasonId,
  });
  const [createReason, createState] = useCreateAttendanceReasonMutation();
  const [updateReason, updateState] = useUpdateAttendanceReasonMutation();
  const saving = createState.isLoading || updateState.isLoading;

  useEffect(() => {
    if (!item) {
      return;
    }
    setForm({
      title: item.title,
      status: item.status ? "true" : "false",
    });
  }, [item]);

  async function onSave() {
    setFormError(null);
    const title = form.title.trim();
    if (!title) {
      setFormError("Title is required");
      return;
    }

    const body = {
      title,
      status: form.status === "true",
    };

    try {
      if (isEdit && reasonId) {
        await updateReason({ id: reasonId, body }).unwrap();
      } else {
        await createReason(body).unwrap();
      }
      router.push("/attendance/reasons");
    } catch (caught) {
      setFormError(
        getApiErrorMessage(caught, "Could not save attendance reason"),
      );
    }
  }

  if (reasonId && isLoading) {
    return <p className="text-sm text-muted">Loading attendance reason…</p>;
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (!readOnly) {
          void onSave();
        }
      }}
      className="rounded-2xl bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] sm:p-8"
    >
      <fieldset disabled={readOnly || saving}>
        <h1 className="mb-6 text-xl font-semibold text-foreground">
          {readOnly
            ? "Attendance reason"
            : isEdit
              ? "Edit attendance reason"
              : "Add attendance reason"}
        </h1>
        <p className="mb-6 text-sm text-muted">
          Reasons appear in the dropdown when marking a student absent.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="title" label="Title" required>
            <input
              id="title"
              required
              maxLength={255}
              value={form.title}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  title: event.target.value,
                }))
              }
              placeholder="Sick"
              className={inputClass}
            />
          </Field>
          <Field id="status" label="Status">
            <select
              id="status"
              value={form.status}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  status: event.target.value,
                }))
              }
              className={`${inputClass} cursor-pointer`}
            >
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </Field>
        </div>
        {formError ? (
          <p className="mt-4 text-sm text-red-600" role="alert">
            {formError}
          </p>
        ) : null}
        {!readOnly ? (
          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => router.push("/attendance/reasons")}
              className="inline-flex h-11 cursor-pointer items-center justify-center rounded-xl border border-border bg-white px-5 text-sm font-medium text-foreground hover:bg-stone-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex h-11 cursor-pointer items-center justify-center rounded-xl bg-primary px-5 text-sm font-medium text-on-primary hover:bg-primary-hover disabled:opacity-50"
            >
              {saving ? "Saving…" : isEdit ? "Save changes" : "Save"}
            </button>
          </div>
        ) : null}
      </fieldset>
    </form>
  );
}
