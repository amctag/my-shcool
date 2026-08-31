"use client";

import type { ReactNode } from "react";

export function TableSearchBar({
  value = "",
  onChange,
  onSearch,
  placeholder = "Search",
  label = "Search",
  children,
  compact = false,
  hideInput = false,
}: {
  value?: string;
  onChange?: (value: string) => void;
  onSearch: () => void;
  placeholder?: string;
  label?: string;
  children?: ReactNode;
  compact?: boolean;
  hideInput?: boolean;
}) {
  const searchField = hideInput ? null : (
    <label
      className={
        compact
          ? "relative w-56 shrink-0"
          : "relative w-full min-w-0 shrink-0 sm:w-1/2"
      }
    >
      <span className="sr-only">{label}</span>
      <input
        type="search"
        value={value}
        onChange={(event) => onChange?.(event.target.value)}
        placeholder={placeholder}
        className={`h-11 rounded-lg border border-border bg-white px-3 text-sm outline-none transition-colors duration-200 focus:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${
          compact ? "w-56" : "w-full min-w-48"
        }`}
      />
    </label>
  );

  return (
    <form
      className="flex w-full min-w-0 flex-wrap items-center gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        onSearch();
      }}
    >
      {compact ? children : searchField}
      {compact ? searchField : children}
      <button
        type="submit"
        className={`inline-flex h-11 shrink-0 cursor-pointer items-center justify-center rounded-lg bg-foreground text-sm font-medium text-white transition-colors duration-200 hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${
          compact ? "px-3" : "px-4"
        }`}
      >
        Search
      </button>
    </form>
  );
}
