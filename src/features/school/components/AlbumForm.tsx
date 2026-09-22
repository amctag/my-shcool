"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { FilterSelect } from "@/components/dashboard/FilterSelect";
import { LoadingDots } from "@/components/dashboard/TableLoading";
import { getApiErrorMessage } from "@/lib/getApiErrorMessage";
import {
  useCreateDashboardAlbumMutation,
  useGetDashboardAlbumQuery,
  useUpdateDashboardAlbumMutation,
} from "@/features/school/api/albumsApi";
import { useUploadDashboardMediaMutation } from "@/features/school/api/uploadsApi";
import { useSchoolYearFilter } from "@/features/school/useSchoolYearFilter";
import { selectAuthReady, selectAccessToken } from "@/features/auth/authSlice";
import { useAppSelector } from "@/store/hooks";
import type { SaveAlbumBody } from "@/features/school/types";

const inputClass =
  "h-11 w-full rounded-xl border border-border bg-white px-3 text-sm text-foreground outline-none transition-colors duration-200 placeholder:text-muted/80 focus:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

const IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "webp", "gif"];

type AlbumPhoto = {
  url: string;
  name: string;
};

type AlbumFormState = {
  title: string;
  description: string;
  date: string;
  yearId: number;
  photos: AlbumPhoto[];
};

function todayInputValue(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

function emptyForm(): AlbumFormState {
  return {
    title: "",
    description: "",
    date: todayInputValue(),
    yearId: 0,
    photos: [],
  };
}

function isAllowedImage(file: File): boolean {
  if (IMAGE_EXTENSIONS.some((ext) => file.name.toLowerCase().endsWith(`.${ext}`))) {
    return true;
  }
  return file.type.startsWith("image/");
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

export function AlbumForm({ albumId }: { albumId?: number }) {
  const router = useRouter();
  const ready = useAppSelector(selectAuthReady);
  const accessToken = useAppSelector(selectAccessToken);
  const canFetch = ready && Boolean(accessToken);
  const isEditing = Boolean(albumId);
  const [form, setForm] = useState<AlbumFormState>(emptyForm);
  const [hydrated, setHydrated] = useState(!isEditing);
  const [formError, setFormError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const { years, yearId: globalYearId, setYearId } =
    useSchoolYearFilter(canFetch);
  const albumQuery = useGetDashboardAlbumQuery(albumId ?? 0, {
    skip: !canFetch || !albumId,
  });
  const [createAlbum, createState] = useCreateDashboardAlbumMutation();
  const [updateAlbum, updateState] = useUpdateDashboardAlbumMutation();
  const [uploadMedia] = useUploadDashboardMediaMutation();
  const saving = createState.isLoading || updateState.isLoading;

  useEffect(() => {
    if (!globalYearId || isEditing) {
      return;
    }
    setForm((current) =>
      current.yearId === 0 ? { ...current, yearId: globalYearId } : current,
    );
  }, [globalYearId, isEditing]);

  useEffect(() => {
    if (!albumQuery.data || hydrated) {
      return;
    }
    setYearId(albumQuery.data.yearId);
    setForm({
      title: albumQuery.data.title,
      description: albumQuery.data.description,
      date: albumQuery.data.date.slice(0, 10),
      yearId: albumQuery.data.yearId,
      photos: albumQuery.data.images.map((image) => ({
        url: image.imageLink,
        name: fileNameFromUrl(image.imageLink),
      })),
    });
    setHydrated(true);
  }, [albumQuery.data, hydrated]);

  async function uploadPhotos(files: File[]): Promise<void> {
    setFormError(null);
    setUploading(true);
    try {
      const uploaded: AlbumPhoto[] = [];
      for (const file of files) {
        if (!isAllowedImage(file)) {
          setFormError("Please choose JPG, PNG, WEBP, or GIF images.");
          continue;
        }
        const result = await uploadMedia({ file, kind: "image" }).unwrap();
        uploaded.push({ url: result.url, name: file.name });
      }
      if (uploaded.length > 0) {
        setForm((current) => ({
          ...current,
          photos: [...current.photos, ...uploaded],
        }));
      }
    } catch (caught) {
      setFormError(
        getApiErrorMessage(
          caught,
          "Could not upload that image. Please try again.",
        ),
      );
    } finally {
      setUploading(false);
    }
  }

  async function onSave() {
    if (uploading) {
      return;
    }
    setFormError(null);
    const title = form.title.trim();
    const description = form.description.trim();
    if (!title) {
      setFormError("Title is required");
      return;
    }
    if (!description) {
      setFormError("Description is required");
      return;
    }
    if (form.yearId <= 0) {
      setFormError("Year is required");
      return;
    }

    const body: SaveAlbumBody = {
      title,
      description,
      date: form.date || undefined,
      yearId: form.yearId,
      imageLinks: form.photos.map((photo) => photo.url),
    };

    try {
      if (albumId) {
        await updateAlbum({ id: albumId, body }).unwrap();
      } else {
        await createAlbum(body).unwrap();
      }
      router.push("/albums");
    } catch (error) {
      setFormError(
        getApiErrorMessage(
          error,
          albumId ? "Could not update album" : "Could not create album",
        ),
      );
    }
  }

  if (isEditing && (albumQuery.isLoading || !hydrated)) {
    return <LoadingDots label="Loading album" />;
  }

  if (isEditing && albumQuery.error) {
    return (
      <p className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700" role="alert">
        {getApiErrorMessage(albumQuery.error, "Could not load album")}
      </p>
    );
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
        {isEditing ? "Edit album" : "Add album"}
      </h1>

      <div className="mx-auto flex max-w-2xl flex-col gap-5">
        <Field id="album-title" label="Title" required>
          <input
            id="album-title"
            type="text"
            value={form.title}
            onChange={(event) =>
              setForm((current) => ({ ...current, title: event.target.value }))
            }
            placeholder="Sports Day 2026"
            className={inputClass}
          />
        </Field>

        <Field id="album-description" label="Description" required>
          <textarea
            id="album-description"
            value={form.description}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                description: event.target.value,
              }))
            }
            placeholder="Write a short description…"
            rows={5}
            className={`${inputClass} min-h-[8rem] resize-y py-3`}
          />
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field id="album-date" label="Date">
            <input
              id="album-date"
              type="date"
              value={form.date}
              onChange={(event) =>
                setForm((current) => ({ ...current, date: event.target.value }))
              }
              className={inputClass}
            />
          </Field>

          <Field id="album-year" label="Year" required>
            <FilterSelect
              label="Year"
              value={form.yearId}
              options={years.map((year) => ({
                value: year.id,
                label: year.isCurrent ? `${year.title} (current)` : year.title,
              }))}
              onChange={(nextYearId) => {
                setYearId(nextYearId);
                setForm((current) => ({ ...current, yearId: nextYearId }));
              }}
            />
          </Field>
        </div>

        <Field id="album-photos" label="Photos">
          <input
            id="album-photos"
            type="file"
            multiple
            accept=".jpg,.jpeg,.png,.webp,.gif,image/jpeg,image/png,image/webp,image/gif"
            onChange={(event) => {
              const files = Array.from(event.target.files ?? []);
              event.target.value = "";
              if (files.length === 0) {
                return;
              }
              void uploadPhotos(files);
            }}
            className={`${inputClass} cursor-pointer file:mr-3 file:rounded-lg file:border-0 file:bg-primary-soft file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-foreground`}
          />
        </Field>
        {uploading ? (
          <p className="-mt-3 text-sm text-muted">Uploading photos…</p>
        ) : form.photos.length > 0 ? (
          <div className="-mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {form.photos.map((photo) => (
              <div
                key={photo.url}
                className="overflow-hidden rounded-xl border border-border"
              >
                {isHttpUrl(photo.url) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={photo.url}
                    alt={photo.name}
                    className="h-28 w-full object-cover"
                  />
                ) : (
                  <div className="flex h-28 items-center justify-center bg-primary-soft text-xs text-muted">
                    {photo.name}
                  </div>
                )}
                <button
                  type="button"
                  className="min-h-11 w-full text-sm font-medium text-red-600 hover:bg-red-50"
                  onClick={() =>
                    setForm((current) => ({
                      ...current,
                      photos: current.photos.filter(
                        (item) => item.url !== photo.url,
                      ),
                    }))
                  }
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="-mt-3 text-sm text-muted">
            Optional. You can add several photos. Parents and teachers of this
            year receive a notification.
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
            onClick={() => router.push("/albums")}
            className="inline-flex h-11 cursor-pointer items-center justify-center rounded-xl border border-border px-5 text-sm font-medium hover:bg-primary-soft"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || uploading}
            className="inline-flex h-11 cursor-pointer items-center justify-center rounded-xl bg-primary px-5 text-sm font-medium text-on-primary hover:bg-primary-hover disabled:opacity-50"
          >
            {uploading
              ? "Uploading…"
              : saving
                ? "Saving…"
                : isEditing
                  ? "Save album"
                  : "Create album"}
          </button>
        </div>
      </div>
    </form>
  );
}
