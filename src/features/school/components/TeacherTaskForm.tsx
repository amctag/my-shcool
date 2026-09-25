"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { getApiErrorMessage } from "@/lib/getApiErrorMessage";
import { useCreateDashboardTeacherTaskMutation } from "@/features/school/api/teacherTasksApi";

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
    <label htmlFor={id} className="block min-w-0">
      <span className="mb-1.5 block text-sm font-medium text-foreground">
        {label}
        {required ? " *" : ""}
      </span>
      {children}
    </label>
  );
}

export function TeacherTaskForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [createTask, { isLoading }] = useCreateDashboardTeacherTaskMutation();

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const nextTitle = title.trim();
    const nextDescription = description.trim();
    if (!nextTitle || !nextDescription) {
      setFormError("Title and description are required.");
      return;
    }
    setFormError(null);
    try {
      await createTask({
        title: nextTitle,
        description: nextDescription,
      }).unwrap();
      router.push("/teacher-tasks");
      router.refresh();
    } catch (error) {
      setFormError(getApiErrorMessage(error, "Could not create task"));
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mx-auto max-w-2xl space-y-5 rounded-2xl border border-border bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)]"
    >
      <div>
        <h1 className="text-xl font-semibold text-foreground">Add teacher task</h1>
        <p className="mt-1 text-sm text-muted">
          All active teachers will get a push notification when you create this
          task.
        </p>
      </div>

      <Field id="task-title" label="Title" required>
        <input
          id="task-title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="e.g. Submit midterm grades"
          className={inputClass}
        />
      </Field>

      <Field id="task-description" label="Description" required>
        <textarea
          id="task-description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Write what teachers need to do…"
          rows={6}
          className={`${inputClass} min-h-[9rem] resize-y py-3`}
        />
      </Field>

      {formError ? (
        <p className="text-sm text-red-600" role="alert">
          {formError}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3 pt-1">
        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex h-11 cursor-pointer items-center justify-center rounded-lg bg-primary px-5 text-sm font-medium text-on-primary hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? "Creating…" : "Create & notify"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/teacher-tasks")}
          className="inline-flex h-11 cursor-pointer items-center justify-center rounded-lg border border-border bg-white px-5 text-sm font-medium text-foreground hover:bg-stone-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
