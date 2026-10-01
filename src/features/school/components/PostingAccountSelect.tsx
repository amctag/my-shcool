"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronsUpDown } from "lucide-react";
import { useGetDashboardPostingLookupQuery } from "@/features/school/api/accountingApi";
import type { DashboardPostingLookup } from "@/features/school/types";

export function postingAccountLabel(
  account: Pick<DashboardPostingLookup, "name" | "code" | "personName">,
): string {
  return `${account.personName ?? account.name} — ${account.code}`;
}

export function PostingAccountSelect({
  id,
  family,
  value,
  onChange,
  placeholder = "Type account name or code",
  disabled,
}: {
  id: string;
  family: "4" | "5";
  value: DashboardPostingLookup | null;
  onChange: (account: DashboardPostingLookup | null) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  const [text, setText] = useState(value ? postingAccountLabel(value) : "");
  const [lastValue, setLastValue] = useState(value);
  if (value !== lastValue) {
    setLastValue(value);
    setText(value ? postingAccountLabel(value) : "");
  }
  const [debounced, setDebounced] = useState("");
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const listId = `${id}-list`;

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(text), 250);
    return () => window.clearTimeout(timer);
  }, [text]);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!boxRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  const trimmed = debounced.trim();
  const { data: options = [], isFetching } =
    useGetDashboardPostingLookupQuery(
      { family, search: trimmed, limit: 20 },
      { skip: !open || trimmed.length < 1 || disabled },
    );

  return (
    <div ref={boxRef} className="relative min-w-0">
      <input
        id={id}
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={open}
        aria-controls={listId}
        autoComplete="off"
        disabled={disabled}
        value={text}
        placeholder={placeholder}
        onFocus={() => setOpen(true)}
        onChange={(event) => {
          setText(event.target.value);
          setOpen(true);
          if (value) {
            onChange(null);
          }
        }}
        className="h-11 w-full rounded-xl border border-border bg-white pr-9 pl-3 text-sm text-foreground outline-none transition-colors duration-200 placeholder:text-muted/80 focus:border-primary disabled:cursor-not-allowed disabled:opacity-60"
      />
      <ChevronsUpDown
        aria-hidden
        className="pointer-events-none absolute top-3.5 right-3 h-4 w-4 text-muted"
      />
      {open && !disabled ? (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-border bg-white py-1 shadow-[0_8px_30px_rgb(0,0,0,0.08)]"
        >
          {trimmed.length < 1 ? (
            <li className="px-3 py-3 text-sm text-muted">
              Type an account name or code
            </li>
          ) : isFetching ? (
            <li className="px-3 py-3 text-sm text-muted">Searching…</li>
          ) : options.length === 0 ? (
            <li className="px-3 py-3 text-sm text-muted">
              No posting accounts match
            </li>
          ) : (
            options.map((option) => (
              <li
                key={option.id}
                role="option"
                aria-selected={value?.id === option.id}
              >
                <button
                  type="button"
                  onClick={() => {
                    onChange(option);
                    setText(postingAccountLabel(option));
                    setOpen(false);
                  }}
                  className="flex w-full cursor-pointer flex-col gap-0.5 px-3 py-2 text-left hover:bg-stone-50"
                >
                  <span className="text-sm font-medium text-foreground">
                    {postingAccountLabel(option)}
                  </span>
                  <span className="font-mono text-xs tabular-nums text-muted">
                    {option.code}
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
      ) : null}
    </div>
  );
}
