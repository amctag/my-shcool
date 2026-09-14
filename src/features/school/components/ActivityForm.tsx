"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { FilterSelect } from "@/components/dashboard/FilterSelect";
import { getApiErrorMessage } from "@/lib/getApiErrorMessage";
import { useCreateDashboardActivityMutation } from "@/features/school/api/activitiesApi";
import { useUploadDashboardMediaMutation } from "@/features/school/api/uploadsApi";
import { useSchoolYearFilter } from "@/features/school/useSchoolYearFilter";
import { selectAuthReady, selectAccessToken } from "@/features/auth/authSlice";
import { useAppSelector } from "@/store/hooks";
import type { SaveActivityBody } from "@/features/school/types";

const inputClass =
  "h-11 w-full rounded-xl border border-border bg-white px-3 text-sm text-foreground outline-none transition-colors duration-200 placeholder:text-muted/80 focus:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

const IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "webp", "gif"];

type ActivityFormState = {
  title: string;
  content: string;
  date: string;
  image: string;
  imageName: string;
  yearId: number;
};

function todayInputValue(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

function emptyForm(): ActivityFormState {
  return {
    title: "",
    content: "",
    date: todayInputValue(),
    image: "",
    imageName: "",
    yearId: 0,
  };
}

function hasExtension(name: string, extensions: string[]): boolean {
  const lower = name.toLowerCase();
  return extensions.some((ext) => lower.endsWith(`.${ext}`));
}

function fileNameFromUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }
  try {
    const path = new URL(trimmed).pathname;
    const name = path.split("/").filter(Boolean).pop();
    return name || trimmed;
  } catch {
    return trimmed.split("/").filter(Boolean).pop() || trimmed;
  }
}

function isHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
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
    <label htmlFor={id} className="block min-w-0">
      <span className="mb-1.5 block text-sm font-medium text-foreground">
        {label}
        {required ? " *" : ""}
      </span>
      {children}
    </label>
  );
}

export function ActivityForm() {
  const router = useRouter();
  const ready = useAppSelector(selectAuthReady);
  const accessToken = useAppSelector(selectAccessToken);
  const canFetch = ready && Boolean(accessToken);
  const [form, setForm] = useState<ActivityFormState>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const { years, yearId: defaultYearId } = useSchoolYearFilter(canFetch);
  const [createActivity, createState] = useCreateDashboardActivityMutation();
  const [uploadMedia] = useUploadDashboardMediaMutation();

  useEffect(() => {
    if (!defaultYearId) {
      return;
    }
    setForm((current) =>
      current.yearId === 0 ? { ...current, yearId: defaultYearId } : current,
    );
  }, [defaultYearId]);

  async function uploadImage(file: File): Promise<void> {
    setFormError(null);
    setUploadingImage(true);
    try {
      const result = await uploadMedia({ file, kind: "image" }).unwrap();
      setForm((current) => ({
        ...current,
        image: result.url,
        imageName: file.name,
      }));
    } catch (caught) {
      setFormError(
        getApiErrorMessage(
          caught,
          "Could not upload that image. Please try again.",
        ),
      );
    } finally {
      setUploadingImage(false);
    }
  }

  async function onSave() {
    if (uploadingImage) {
      return;
    }
    setFormError(null);
    const title = form.title.trim();
    const content = form.content.trim();
    if (!title) {
      setFormError("Title is required");
      return;
    }
    if (!content) {
      setFormError("Content is required");
      return;
    }

    const body: SaveActivityBody = {
      title,
      content,
      date: form.date || undefined,
      ...(form.image.trim() ? { image: form.image.trim() } : {}),
      ...(form.yearId > 0 ? { yearId: form.yearId } : {}),
    };

    try {
      await createActivity(body).unwrap();
      router.push("/activities");
    } catch (error) {
      setFormError(getApiErrorMessage(error, "Could not create activity"));
    }
  }

  return (
    <form
      className="rounded-3xl border border-border bg-white p-6 shadow-sm sm:p-8"
      onSubmit={(event) => {
        event.preventDefault();
        void onSave();
      }}
    >
      <h1 className="mb-8 text-center text-3xl font-semibold tracking-tight text-foreground">
        Add Activity
      </h1>

      <div className="mx-auto flex max-w-2xl flex-col gap-5">
        <Field id="activity-title" label="Title" required>
          <input
            id="activity-title"
            type="text"
            value={form.title}
            onChange={(event) =>
              setForm((current) => ({ ...current, title: event.target.value }))
            }
            placeholder="Sports Day"
            className={inputClass}
          />
        </Field>

        <Field id="activity-content" label="Content" required>
          <textarea
            id="activity-content"
            value={form.content}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                content: event.target.value,
              }))
            }
            placeholder="Write the activity details…"
            rows={6}
            className={`${inputClass} min-h-[9rem] resize-y py-3`}
          />
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field id="activity-date" label="Date">
            <input
              id="activity-date"
              type="date"
              value={form.date}
              onChange={(event) =>
                setForm((current) => ({ ...current, date: event.target.value }))
              }
              className={inputClass}
            />
          </Field>

          <Field id="activity-year" label="Year">
            <FilterSelect
              label="Year"
              value={form.yearId}
              options={[
                { value: 0, label: "All school" },
                ...years.map((year) => ({
                  value: year.id,
                  label: year.isCurrent ? `${year.title} (current)` : year.title,
                })),
              ]}
              onChange={(yearId) =>
                setForm((current) => ({ ...current, yearId }))
              }
            />
          </Field>
        </div>

        <Field id="activity-image" label="Image">
          <input
            id="activity-image"
            type="file"
            accept=".jpg,.jpeg,.png,.webp,.gif,image/jpeg,image/png,image/webp,image/gif"
            onChange={(event) => {
              const file = event.target.files?.[0] ?? null;
              event.target.value = "";
              if (!file) {
                return;
              }
              if (!hasExtension(file.name, IMAGE_EXTENSIONS)) {
                setFormError("Please choose a JPG, PNG, WEBP, or GIF image.");
                return;
              }
              void uploadImage(file);
            }}
            className={`${inputClass} cursor-pointer file:mr-3 file:rounded-lg file:border-0 file:bg-primary-soft file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-foreground`}
          />
        </Field>
        {uploadingImage ? (
          <p className="-mt-3 text-sm text-muted">Uploading image…</p>
        ) : form.image ? (
          <div className="-mt-3 space-y-2">
            {isHttpUrl(form.image) ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={form.image}
                alt={form.imageName || "Activity image"}
                className="max-h-40 rounded-xl border border-border object-contain"
              />
            ) : null}
            <p className="text-sm text-muted">
              {form.imageName || fileNameFromUrl(form.image)}
            </p>
            <button
              type="button"
              className="min-h-11 text-sm font-medium text-red-600 hover:underline"
              onClick={() =>
                setForm((current) => ({
                  ...current,
                  image: "",
                  imageName: "",
                }))
              }
            >
              Remove image
            </button>
          </div>
        ) : (
          <p className="-mt-3 text-sm text-muted">
            Optional. JPG, PNG, WEBP, or GIF. Parents with the app receive a
            Firebase notification.
          </p>
        )}

        {formError ? (
          <p className="text-sm text-red-600" role="alert">
            {formError}
          </p>
        ) : null}

        <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => router.push("/activities")}
            className="inline-flex h-11 cursor-pointer items-center justify-center rounded-xl border border-border px-5 text-sm font-medium hover:bg-primary-soft"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={createState.isLoading || uploadingImage}
            className="inline-flex h-11 cursor-pointer items-center justify-center rounded-xl bg-primary px-5 text-sm font-medium text-on-primary hover:bg-primary-hover disabled:opacity-50"
          >
            {uploadingImage
              ? "Uploading…"
              : createState.isLoading
                ? "Saving…"
                : "Create activity"}
          </button>
        </div>
      </div>
    </form>
  );
}
