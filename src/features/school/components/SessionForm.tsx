"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { getApiErrorMessage } from "@/lib/getApiErrorMessage";
import { selectAuthReady } from "@/features/auth/authSlice";
import {
  useCreateSessionMutation,
  useGetSessionQuery,
  useUpdateSessionMutation,
} from "@/features/school/api/sessionsApi";
import { useAppSelector } from "@/store/hooks";

const inputClass =
  "h-11 w-full rounded-xl border border-border bg-white px-3 text-sm text-foreground outline-none transition-colors duration-200 placeholder:text-muted/80 focus:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

type FormState = {
  sessionName: string;
  position: string;
  status: string;
};

function emptyForm(): FormState {
  return { sessionName: "", position: "1", status: "true" };
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

export function SessionForm({
  sessionId,
  readOnly = false,
}: {
  sessionId?: number;
  readOnly?: boolean;
}) {
  const router = useRouter();
  const authReady = useAppSelector(selectAuthReady);
  const isEdit = Boolean(sessionId) && !readOnly;
  const [form, setForm] = useState<FormState>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);

  const { data: item, isLoading } = useGetSessionQuery(sessionId ?? 0, {
    skip: !authReady || !sessionId,
  });
  const [createSession, createState] = useCreateSessionMutation();
  const [updateSession, updateState] = useUpdateSessionMutation();
  const saving = createState.isLoading || updateState.isLoading;

  useEffect(() => {
    if (!item) return;
    setForm({
      sessionName: item.sessionName,
      position: String(item.position),
      status: item.status ? "true" : "false",
    });
  }, [item]);

  async function onSave() {
    setFormError(null);
    const sessionName = form.sessionName.trim();
    if (!sessionName) {
      setFormError("Session name is required");
      return;
    }
    const position = Number(form.position);
    if (!Number.isInteger(position) || position < 0) {
      setFormError("Position must be a non-negative number");
      return;
    }

    const body = {
      sessionName,
      position,
      status: form.status === "true",
    };

    try {
      if (isEdit && sessionId) {
        await updateSession({ id: sessionId, body }).unwrap();
      } else {
        await createSession(body).unwrap();
      }
      router.push("/agenda/sessions");
    } catch (caught) {
      setFormError(getApiErrorMessage(caught, "Could not save session"));
    }
  }

  if (sessionId && isLoading) {
    return <p className="text-sm text-muted">Loading session…</p>;
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (!readOnly) void onSave();
      }}
      className="rounded-2xl bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] sm:p-8"
    >
      <fieldset disabled={readOnly || saving}>
        <h1 className="mb-6 text-xl font-semibold text-foreground">
          {readOnly
            ? "Session"
            : isEdit
              ? "Edit session"
              : "Add session"}
        </h1>
        <p className="mb-6 text-sm text-muted">
          Sessions are timetable periods used in the weekly schedule.
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field id="sessionName" label="Name" required>
            <input
              id="sessionName"
              required
              maxLength={50}
              value={form.sessionName}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  sessionName: event.target.value,
                }))
              }
              placeholder="1st Period"
              className={inputClass}
            />
          </Field>
          <Field id="position" label="Position" required>
            <input
              id="position"
              type="number"
              min={0}
              required
              value={form.position}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  position: event.target.value,
                }))
              }
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
              onClick={() => router.push("/agenda/sessions")}
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
