"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useGetTeachersQuery } from "@/features/school/api/teachersApi";
import { selectAuthReady, selectAccessToken } from "@/features/auth/authSlice";
import { useAppSelector } from "@/store/hooks";

function teacherName(teacher: {
  firstName?: string;
  lastName?: string;
  fullName: string;
}): string {
  const name = `${teacher.firstName ?? ""} ${teacher.lastName ?? ""}`.trim();
  return name || teacher.fullName;
}

export function TeacherFilterSearch({
  value,
  onChange,
}: {
  value: number;
  onChange: (teacherId: number) => void;
}) {
  const id = useId();
  const boxRef = useRef<HTMLDivElement>(null);
  const ready = useAppSelector(selectAuthReady);
  const accessToken = useAppSelector(selectAccessToken);
  const canFetch = ready && Boolean(accessToken);
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(query.trim()), 250);
    return () => window.clearTimeout(timer);
  }, [query]);

  const { data, isFetching } = useGetTeachersQuery(
    {
      page: 1,
      limit: 20,
      search: debounced,
      sortBy: "name",
      sortOrder: "asc",
    },
    { skip: !canFetch || debounced.length < 1 },
  );
  const teachers = data?.items ?? [];

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!boxRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  const showList = open && debounced.length >= 1;

  return (
    <div ref={boxRef} className="relative w-56 shrink-0">
      <label htmlFor={id} className="sr-only">
        Filter by teacher
      </label>
      <input
        id={id}
        type="text"
        autoComplete="off"
        value={query}
        placeholder="Teacher name"
        aria-autocomplete="list"
        aria-expanded={showList}
        aria-controls={`${id}-list`}
        onFocus={() => setOpen(true)}
        onChange={(event) => {
          const next = event.target.value;
          setQuery(next);
          setOpen(true);
          if (value !== 0) {
            onChange(0);
          }
        }}
        onKeyDown={(event) => {
          if (event.key !== "Enter" || teachers.length === 0) {
            return;
          }
          event.preventDefault();
          const teacher = teachers[0];
          const label = teacherName(teacher);
          setQuery(label);
          onChange(teacher.id);
          setOpen(false);
        }}
        className="h-11 w-full rounded-xl border border-border bg-white px-3 text-sm text-foreground outline-none transition-colors duration-200 placeholder:text-muted/80 focus:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      />
      {showList ? (
        <ul
          id={`${id}-list`}
          role="listbox"
          className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-border bg-white py-1 shadow-[0_8px_30px_rgb(0,0,0,0.08)]"
        >
          {isFetching && teachers.length === 0 ? (
            <li className="px-3 py-3 text-sm text-muted">Searching…</li>
          ) : teachers.length === 0 ? (
            <li className="px-3 py-3 text-sm text-muted">No teachers match</li>
          ) : (
            teachers.map((teacher) => {
              const label = teacherName(teacher);
              const active = teacher.id === value;
              return (
                <li key={teacher.id} role="option" aria-selected={active}>
                  <button
                    type="button"
                    onClick={() => {
                      setQuery(label);
                      onChange(teacher.id);
                      setOpen(false);
                    }}
                    className={`flex min-h-11 w-full cursor-pointer items-center px-3 text-left text-sm transition-colors duration-200 ${
                      active
                        ? "bg-primary-soft font-medium text-primary"
                        : "text-foreground hover:bg-primary-soft hover:text-primary"
                    }`}
                  >
                    {label}
                  </button>
                </li>
              );
            })
          )}
        </ul>
      ) : null}
    </div>
  );
}
