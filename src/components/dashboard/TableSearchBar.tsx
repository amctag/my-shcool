"use client";

import type { ReactNode } from "react";

export function TableSearchBar({
  value,
  onChange,
  onSearch,
  placeholder,
  label,
  children,
}: {
  value: string;
  onChange: (value: string) => void;
  onSearch: () => void;
  placeholder: string;
  label: string;
  children?: ReactNode;
}) {
  return (
    <form
      className="flex w-full min-w-0 max-w-3xl flex-wrap items-center gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        onSearch();
      }}
    >
      <label className="relative min-w-0 flex-1">
        <span className="sr-only">{label}</span>
        <input
          type="search"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="h-11 w-full min-w-48 rounded-lg border border-border bg-white px-3 text-sm outline-none transition-colors duration-200 focus:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        />
      </label>
      {children}
      <button
        type="submit"
        className="inline-flex h-11 shrink-0 cursor-pointer items-center justify-center rounded-lg bg-foreground px-4 text-sm font-medium text-white transition-colors duration-200 hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        Search
      </button>
    </form>
  );
}
