"use client";

export function LoadingDots({ label }: { label: string }) {
  return (
    <div
      className="flex items-center justify-center py-10"
      role="status"
      aria-live="polite"
    >
      <span className="sr-only">{label}</span>
      <span className="inline-flex items-center gap-2" aria-hidden>
        <span className="table-loading-dot h-2.5 w-2.5 rounded-full bg-primary" />
        <span className="table-loading-dot table-loading-dot-2 h-2.5 w-2.5 rounded-full bg-primary" />
        <span className="table-loading-dot table-loading-dot-3 h-2.5 w-2.5 rounded-full bg-primary" />
      </span>
    </div>
  );
}

export function TableLoadingRow({
  colSpan,
  label,
}: {
  colSpan: number;
  label: string;
}) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-5">
        <LoadingDots label={label} />
      </td>
    </tr>
  );
}
