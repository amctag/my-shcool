"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { FileText } from "lucide-react";
import { YearFilterSelect } from "@/components/dashboard/YearFilterSelect";
import { getApiErrorMessage } from "@/lib/getApiErrorMessage";
import { selectAuthReady, selectAccessToken } from "@/features/auth/authSlice";
import {
  useCreateDashboardAgendaMutation,
  useGetDashboardAgendaQuery,
  useUpdateDashboardAgendaMutation,
} from "@/features/school/api/agendasApi";
import { useUploadDashboardMediaMutation } from "@/features/school/api/uploadsApi";
import { useGetClassesQuery } from "@/features/school/api/classesApi";
import { useGetClassCoursesQuery } from "@/features/school/api/coursesApi";
import { useGetSectionsQuery } from "@/features/school/api/sectionsApi";
import { useSchoolYearFilter } from "@/features/school/useSchoolYearFilter";
import { useAppSelector } from "@/store/hooks";
import type { SaveAgendaBody } from "@/features/school/types";

const inputClass =
  "h-11 w-full rounded-xl border border-border bg-white px-3 text-sm text-foreground outline-none transition-colors duration-200 placeholder:text-muted/80 focus:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

type FormState = {
  title: string;
  description: string;
  agendaDate: string;
  time: string;
  courseId: number;
  classId: number;
  sectionIds: number[];
  imageLink: string;
  imageName: string;
  fileLink: string;
  fileName: string;
  status: string;
};

function emptyForm(): FormState {
  return {
    title: "",
    description: "",
    agendaDate: "",
    time: "",
    courseId: 0,
    classId: 0,
    sectionIds: [],
    imageLink: "",
    imageName: "",
    fileLink: "",
    fileName: "",
    status: "1",
  };
}

const IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "webp", "gif"];

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
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
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
    <label htmlFor={id} className="block min-w-0 flex-1">
      <span className="mb-1.5 block text-sm font-medium text-foreground">
        {label}
        {required ? " *" : ""}
      </span>
      {children}
    </label>
  );
}

export function AgendaForm({
  agendaId,
  readOnly = false,
}: {
  agendaId?: number;
  readOnly?: boolean;
}) {
  const router = useRouter();
  const ready = useAppSelector(selectAuthReady);
  const accessToken = useAppSelector(selectAccessToken);
  const canFetch = ready && Boolean(accessToken);
  const isEdit = Boolean(agendaId) && !readOnly;
  const [form, setForm] = useState<FormState>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const { years, yearId, setYearId } = useSchoolYearFilter(canFetch);

  const { data: item, isLoading } = useGetDashboardAgendaQuery(agendaId ?? 0, {
    skip: !canFetch || !agendaId,
  });
  const [createAgenda, createState] = useCreateDashboardAgendaMutation();
  const [updateAgenda, updateState] = useUpdateDashboardAgendaMutation();
  const [uploadMedia] = useUploadDashboardMediaMutation();
  const saving = createState.isLoading || updateState.isLoading;
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const busy = saving || uploadingImage || uploadingPdf;

  const { data: classesData } = useGetClassesQuery(
    { page: 1, limit: 100, sortOrder: "asc" },
    { skip: !canFetch },
  );

  const classSelected = form.classId > 0;
  const { data: classCoursesData } = useGetClassCoursesQuery(
    {
      page: 1,
      limit: 100,
      classId: form.classId,
      yearId: yearId || undefined,
      status: "active",
      sortBy: "course",
      sortOrder: "asc",
    },
    { skip: !canFetch || !yearId || !classSelected },
  );
  const { data: sectionsData } = useGetSectionsQuery(
    {
      page: 1,
      limit: 100,
      yearId: yearId || undefined,
      classId: form.classId,
      sortBy: "section",
      sortOrder: "asc",
    },
    { skip: !canFetch || !yearId || !classSelected },
  );

  const classes = classesData?.items ?? [];
  const courses = classCoursesData?.items ?? [];
  const sections = sectionsData?.items ?? [];

  useEffect(() => {
    if (!item) {
      return;
    }
    const firstSection = item.sections[0];
    if (firstSection?.yearId) {
      setYearId(firstSection.yearId);
    }
    setForm({
      title: item.title ?? "",
      description: item.description,
      agendaDate: item.agendaDate,
      time: item.time,
      courseId: item.courseId,
      classId: firstSection?.classId ?? 0,
      sectionIds: item.sections.map((section) => section.sectionId),
      imageLink: item.imageLink,
      imageName: fileNameFromUrl(item.imageLink),
      fileLink: item.fileLink,
      fileName: fileNameFromUrl(item.fileLink),
      status: String(item.status),
    });
  }, [item]);

  function toggleSection(sectionId: number) {
    setForm((current) => {
      const selected = current.sectionIds.includes(sectionId);
      return {
        ...current,
        sectionIds: selected
          ? current.sectionIds.filter((id) => id !== sectionId)
          : [...current.sectionIds, sectionId],
      };
    });
  }

  async function uploadPickedFile(
    file: File,
    kind: "image" | "file",
  ): Promise<void> {
    setFormError(null);
    if (kind === "image") {
      setUploadingImage(true);
    } else {
      setUploadingPdf(true);
    }
    try {
      const result = await uploadMedia({ file, kind }).unwrap();
      setForm((current) =>
        kind === "image"
          ? { ...current, imageLink: result.url, imageName: file.name }
          : { ...current, fileLink: result.url, fileName: file.name },
      );
    } catch (caught) {
      setFormError(
        getApiErrorMessage(
          caught,
          kind === "image"
            ? "Could not upload that image. Please try again."
            : "Could not upload that PDF. Please try again.",
        ),
      );
    } finally {
      if (kind === "image") {
        setUploadingImage(false);
      } else {
        setUploadingPdf(false);
      }
    }
  }

  async function onSave() {
    if (uploadingImage || uploadingPdf) {
      return;
    }
    setFormError(null);
    const title = form.title.trim();
    if (!title) {
      setFormError("Title is required");
      return;
    }
    const description = form.description.trim();
    if (!description) {
      setFormError("Description is required");
      return;
    }
    if (!form.agendaDate) {
      setFormError("Date is required");
      return;
    }
    if (!form.time.trim()) {
      setFormError("Time is required");
      return;
    }
    if (!form.classId) {
      setFormError("Class is required");
      return;
    }
    if (!form.courseId) {
      setFormError("Course is required");
      return;
    }
    if (form.sectionIds.length === 0) {
      setFormError("Select at least one section");
      return;
    }

    const body: SaveAgendaBody = {
      title,
      description,
      agendaDate: form.agendaDate,
      time: form.time.trim(),
      courseId: form.courseId,
      sectionIds: form.sectionIds,
      imageLink: form.imageLink.trim(),
      fileLink: form.fileLink.trim(),
      status: form.status === "0" ? 0 : 1,
    };

    try {
      if (isEdit && agendaId) {
        await updateAgenda({ id: agendaId, body }).unwrap();
      } else {
        await createAgenda(body).unwrap();
      }
      router.push("/agenda?saved=1");
    } catch (caught) {
      setFormError(getApiErrorMessage(caught, "Could not save agenda"));
    }
  }

  if (agendaId && isLoading) {
    return <p className="text-sm text-muted">Loading agenda…</p>;
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
      <fieldset disabled={readOnly || busy}>
        <h1 className="mb-6 text-xl font-semibold text-foreground">
          {readOnly ? "Agenda" : isEdit ? "Edit agenda" : "Add agenda"}
        </h1>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="agenda-date" label="Date" required>
            <input
              id="agenda-date"
              type="date"
              required
              value={form.agendaDate}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  agendaDate: event.target.value,
                }))
              }
              className={inputClass}
            />
          </Field>
          <Field id="agenda-time" label="Time" required>
            <input
              id="agenda-time"
              type="time"
              required
              value={form.time}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  time: event.target.value,
                }))
              }
              className={inputClass}
            />
          </Field>
          <Field id="agenda-class" label="Class" required>
            <select
              id="agenda-class"
              required
              value={form.classId}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  classId: Number(event.target.value),
                  courseId: 0,
                  sectionIds: [],
                }))
              }
              className={`${inputClass} cursor-pointer`}
            >
              <option value={0}>Select class</option>
              {classes.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.className}
                </option>
              ))}
            </select>
          </Field>
          <Field id="agenda-course" label="Course" required>
            <select
              id="agenda-course"
              required
              disabled={!classSelected}
              value={form.courseId}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  courseId: Number(event.target.value),
                }))
              }
              className={`${inputClass} cursor-pointer disabled:cursor-not-allowed disabled:opacity-50`}
            >
              <option value={0}>
                {classSelected ? "Select course" : "Select a class first"}
              </option>
              {courses.map((course) => (
                <option key={course.courseId} value={course.courseId}>
                  {course.courseTitle}
                </option>
              ))}
            </select>
          </Field>
          <Field id="agenda-status" label="Status">
            <select
              id="agenda-status"
              value={form.status}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  status: event.target.value,
                }))
              }
              className={`${inputClass} cursor-pointer`}
            >
              <option value="1">Active</option>
              <option value="0">Inactive</option>
            </select>
          </Field>
          <div className="sm:col-span-2">
            <p className="mb-1.5 text-sm font-medium text-foreground">
              Sections *
            </p>
            <div className="mb-2">
              <YearFilterSelect
                years={years}
                value={yearId}
                onChange={(nextYearId) => {
                  setYearId(nextYearId);
                  setForm((current) => ({
                    ...current,
                    courseId: 0,
                    sectionIds: [],
                  }));
                }}
              />
            </div>
            <div
              className="flex flex-col gap-2 rounded-xl border border-border bg-white p-3"
              role="group"
              aria-label="Sections"
            >
              {!classSelected ? (
                <p className="px-1 py-2 text-sm text-muted">
                  Select a class to see its sections.
                </p>
              ) : sections.length === 0 ? (
                <p className="px-1 py-2 text-sm text-muted">
                  No sections for this class.
                </p>
              ) : (
                <>
                  <label className="inline-flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-2 text-sm font-medium text-foreground hover:bg-primary-soft">
                    <input
                      type="checkbox"
                      checked={
                        sections.length > 0 &&
                        sections.every((section) =>
                          form.sectionIds.includes(section.id),
                        )
                      }
                      onChange={() => {
                        const allSelected = sections.every((section) =>
                          form.sectionIds.includes(section.id),
                        );
                        setForm((current) => ({
                          ...current,
                          sectionIds: allSelected
                            ? []
                            : sections.map((section) => section.id),
                        }));
                      }}
                      className="h-4 w-4 shrink-0 cursor-pointer accent-primary"
                    />
                    Select all
                  </label>
                  {sections.map((section) => (
                    <label
                      key={section.id}
                      className="inline-flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-2 text-sm text-foreground hover:bg-primary-soft"
                    >
                      <input
                        type="checkbox"
                        checked={form.sectionIds.includes(section.id)}
                        onChange={() => toggleSection(section.id)}
                        className="h-4 w-4 shrink-0 cursor-pointer accent-primary"
                      />
                      {section.sectionTitle}
                    </label>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>

        <div className="mt-4">
          <Field id="agenda-title" label="Title" required>
            <input
              id="agenda-title"
              type="text"
              required
              maxLength={255}
              value={form.title}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  title: event.target.value,
                }))
              }
              placeholder="e.g. Fractions practice"
              className={inputClass}
            />
          </Field>
        </div>

        <div className="mt-4">
          <Field id="agenda-description" label="Description" required>
            <textarea
              id="agenda-description"
              required
              value={form.description}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
              placeholder="Homework or class work for this day"
              rows={5}
              className={`${inputClass} min-h-[8rem] resize-y py-3`}
            />
          </Field>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <Field id="agenda-image" label="Image">
              <input
                id="agenda-image"
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
                  void uploadPickedFile(file, "image");
                }}
                className={`${inputClass} cursor-pointer file:mr-3 file:rounded-lg file:border-0 file:bg-primary-soft file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-foreground`}
              />
            </Field>
            {uploadingImage ? (
              <p className="mt-2 text-sm text-muted">Uploading image…</p>
            ) : form.imageLink ? (
              <div className="mt-2 space-y-2">
                {isHttpUrl(form.imageLink) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={form.imageLink}
                    alt={form.imageName || "Agenda image"}
                    className="max-h-40 rounded-xl border border-border object-contain"
                  />
                ) : null}
                <p className="text-sm text-muted">
                  {form.imageName || fileNameFromUrl(form.imageLink)}
                </p>
                {!readOnly ? (
                  <button
                    type="button"
                    className="min-h-11 text-sm font-medium text-red-600 hover:underline"
                    onClick={() =>
                      setForm((current) => ({
                        ...current,
                        imageLink: "",
                        imageName: "",
                      }))
                    }
                  >
                    Remove image
                  </button>
                ) : null}
              </div>
            ) : (
              <p className="mt-2 text-sm text-muted">Optional. JPG, PNG, WEBP, or GIF.</p>
            )}
          </div>
          <div>
            <Field id="agenda-file" label="PDF">
              <input
                id="agenda-file"
                type="file"
                accept=".pdf,application/pdf"
                onChange={(event) => {
                  const file = event.target.files?.[0] ?? null;
                  event.target.value = "";
                  if (!file) {
                    return;
                  }
                  if (!hasExtension(file.name, ["pdf"])) {
                    setFormError("Please choose a PDF file.");
                    return;
                  }
                  void uploadPickedFile(file, "file");
                }}
                className={`${inputClass} cursor-pointer file:mr-3 file:rounded-lg file:border-0 file:bg-primary-soft file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-foreground`}
              />
            </Field>
            {uploadingPdf ? (
              <p className="mt-2 text-sm text-muted">Uploading PDF…</p>
            ) : form.fileLink ? (
              <div className="mt-2 space-y-2">
                {isHttpUrl(form.fileLink) ? (
                  <a
                    href={form.fileLink}
                    target="_blank"
                    rel="noreferrer"
                    className="flex min-h-16 items-center gap-3 rounded-xl border border-border bg-white p-3 text-foreground hover:border-primary"
                  >
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
                      <FileText className="h-6 w-6" aria-hidden="true" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-medium text-primary">
                        PDF
                      </span>
                      <span className="block truncate text-sm text-muted">
                        {form.fileName || fileNameFromUrl(form.fileLink)}
                      </span>
                    </span>
                  </a>
                ) : (
                  <div className="flex min-h-16 items-center gap-3 rounded-xl border border-border bg-white p-3">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
                      <FileText className="h-6 w-6" aria-hidden="true" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-medium">File</span>
                      <span className="block truncate text-sm text-muted">
                        {form.fileName || fileNameFromUrl(form.fileLink)}
                      </span>
                    </span>
                  </div>
                )}
                {!readOnly ? (
                  <button
                    type="button"
                    className="min-h-11 text-sm font-medium text-red-600 hover:underline"
                    onClick={() =>
                      setForm((current) => ({
                        ...current,
                        fileLink: "",
                        fileName: "",
                      }))
                    }
                  >
                    Remove PDF
                  </button>
                ) : null}
              </div>
            ) : (
              <p className="mt-2 text-sm text-muted">Optional. PDF only.</p>
            )}
          </div>
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
              onClick={() => router.push("/agenda")}
              className="inline-flex h-11 cursor-pointer items-center justify-center rounded-xl border border-border bg-white px-5 text-sm font-medium text-foreground hover:bg-stone-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              className="inline-flex h-11 cursor-pointer items-center justify-center rounded-xl bg-primary px-5 text-sm font-medium text-on-primary hover:bg-primary-hover disabled:opacity-50"
            >
              {uploadingImage || uploadingPdf
                ? "Uploading…"
                : saving
                  ? "Saving…"
                  : isEdit
                    ? "Save changes"
                    : "Save"}
            </button>
          </div>
        ) : null}
      </fieldset>
    </form>
  );
}
