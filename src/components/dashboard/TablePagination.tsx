"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

function buildPageItems(
  current: number,
  total: number,
): Array<number | "ellipsis"> {
  if (total <= 0) {
    return [];
  }
  if (total <= 7) {
    return Array.from({ length: total }, (_, index) => index + 1);
  }

  const pages = new Set<number>([1, total]);

  if (current <= 3) {
    for (let page = 2; page <= 5; page += 1) {
      pages.add(page);
    }
  } else if (current >= total - 2) {
    for (let page = total - 4; page < total; page += 1) {
      if (page > 1) {
        pages.add(page);
      }
    }
  } else {
    pages.add(current - 1);
    pages.add(current);
    pages.add(current + 1);
  }

  const sorted = [...pages].sort((a, b) => a - b);
  const items: Array<number | "ellipsis"> = [];

  for (let index = 0; index < sorted.length; index += 1) {
    const page = sorted[index];
    if (index > 0 && page - sorted[index - 1] > 1) {
      items.push("ellipsis");
    }
    items.push(page);
  }

  return items;
}

export function TablePagination({
  page,
  totalPages,
  total,
  label,
  disabled = false,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  total?: number;
  label?: string;
  disabled?: boolean;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 0) {
    return null;
  }

  const items = buildPageItems(page, totalPages);
  const summary =
    total !== undefined
      ? `Page ${page} of ${totalPages} · ${total}${label ? ` ${label}` : ""}`
      : `Page ${page} of ${totalPages}`;

  return (
    <div className="flex flex-col gap-3 border-t border-stone-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-muted">{summary}</p>
      <nav
        aria-label="Pagination"
        className="flex flex-wrap items-center gap-1.5"
      >
        <button
          type="button"
          disabled={page <= 1 || disabled}
          onClick={() => onPageChange(page - 1)}
          aria-label="Previous page"
          className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-border bg-white text-foreground transition-colors duration-200 hover:bg-primary-soft hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ChevronLeft aria-hidden className="h-4 w-4" />
        </button>
        {items.map((item, index) =>
          item === "ellipsis" ? (
            <span
              key={`ellipsis-${index}`}
              className="inline-flex h-10 min-w-8 items-center justify-center px-1 text-sm text-muted"
              aria-hidden
            >
              …
            </span>
          ) : (
            <button
              key={item}
              type="button"
              disabled={disabled}
              aria-label={`Page ${item}`}
              aria-current={item === page ? "page" : undefined}
              onClick={() => onPageChange(item)}
              className={`inline-flex h-10 min-w-10 cursor-pointer items-center justify-center rounded-xl border px-2.5 text-sm font-medium tabular-nums transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50 ${
                item === page
                  ? "border-primary bg-primary text-on-primary"
                  : "border-border bg-white text-foreground hover:bg-primary-soft hover:text-primary"
              }`}
            >
              {item}
            </button>
          ),
        )}
        <button
          type="button"
          disabled={page >= totalPages || disabled}
          onClick={() => onPageChange(page + 1)}
          aria-label="Next page"
          className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-border bg-white text-foreground transition-colors duration-200 hover:bg-primary-soft hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ChevronRight aria-hidden className="h-4 w-4" />
        </button>
      </nav>
    </div>
  );
}
