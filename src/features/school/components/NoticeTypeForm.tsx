"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { getApiErrorMessage } from "@/lib/getApiErrorMessage";
import { selectAuthReady } from "@/features/auth/authSlice";
import {
  useCreateNoticeTypeMutation,
  useGetNoticeTypeQuery,
  useUpdateNoticeTypeMutation,
} from "@/features/school/api/noticeTypesApi";
import { useAppSelector } from "@/store/hooks";

const inputClass =
  "h-11 w-full rounded-xl border border-border bg-white px-3 text-sm text-foreground outline-none transition-colors duration-200 placeholder:text-muted/80 focus:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

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

export function NoticeTypeForm({
  typeId,
  readOnly = false,
}: {
  typeId?: number;
  readOnly?: boolean;
}) {
  const router = useRouter();
  const authReady = useAppSelector(selectAuthReady);
  const isEdit = Boolean(typeId) && !readOnly;
  const [title, setTitle] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const { data: item, isLoading } = useGetNoticeTypeQuery(typeId ?? 0, {
    skip: !authReady || !typeId,
  });
  const [createType, createState] = useCreateNoticeTypeMutation();
  const [updateType, updateState] = useUpdateNoticeTypeMutation();
  const saving = createState.isLoading || updateState.isLoading;

  useEffect(() => {
    if (!item) {
      return;
    }
    setTitle(item.title);
  }, [item]);

  async function onSave() {
    setFormError(null);
    const nextTitle = title.trim();
    if (!nextTitle) {
      setFormError("Title is required");
      return;
    }

    try {
      if (isEdit && typeId) {
        await updateType({ id: typeId, body: { title: nextTitle } }).unwrap();
      } else {
        await createType({ title: nextTitle }).unwrap();
      }
      router.push("/notices/types");
    } catch (caught) {
      setFormError(getApiErrorMessage(caught, "Could not save notice type"));
    }
  }

  if (typeId && isLoading) {
    return <p className="text-sm text-muted">Loading notice type…</p>;
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
            ? "Notice type"
            : isEdit
              ? "Edit notice type"
              : "Add notice type"}
        </h1>
        <p className="mb-6 text-sm text-muted">
          Types appear in the dropdown when creating a notice.
        </p>
        <Field id="title" label="Title" required>
          <input
            id="title"
            required
            maxLength={255}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Behavior"
            className={inputClass}
          />
        </Field>
        {formError ? (
          <p className="mt-4 text-sm text-red-600" role="alert">
            {formError}
          </p>
        ) : null}
        {!readOnly ? (
          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => router.push("/notices/types")}
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
