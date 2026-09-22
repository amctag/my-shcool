"use client";

import { useState } from "react";
import { FileDown, FileSpreadsheet, LoaderCircle } from "lucide-react";
import {
  exportRowsToExcel,
  exportRowsToPdf,
  type ExportColumn,
  type ExportRow,
} from "@/lib/exportTable";
import { getApiErrorMessage } from "@/lib/getApiErrorMessage";

export function TableExportButtons({
  title,
  filename,
  columns,
  fetchRows,
  modes = ["excel", "pdf"],
  disabled,
}: {
  title: string;
  filename: string;
  columns: ExportColumn[];
  fetchRows: () => Promise<ExportRow[]>;
  modes?: Array<"excel" | "pdf">;
  disabled?: boolean;
}) {
  const [busy, setBusy] = useState<"excel" | "pdf" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function runExport(mode: "excel" | "pdf") {
    if (busy || disabled) {
      return;
    }
    setBusy(mode);
    setError(null);
    try {
      const rows = await fetchRows();
      if (mode === "excel") {
        exportRowsToExcel(filename, columns, rows);
      } else {
        exportRowsToPdf(filename, title, columns, rows);
      }
    } catch (caught) {
      setError(getApiErrorMessage(caught, `Could not export ${mode.toUpperCase()}`));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-col items-stretch gap-2 sm:items-end">
      <div className="flex flex-wrap items-center gap-2">
        {modes.includes("excel") ? (
          <button
            type="button"
            disabled={disabled || busy != null}
            onClick={() => void runExport("excel")}
            className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-lg border border-border bg-white px-3 text-sm font-medium text-foreground transition-colors hover:bg-primary-soft hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy === "excel" ? (
              <LoaderCircle aria-hidden className="h-4 w-4 animate-spin" />
            ) : (
              <FileSpreadsheet aria-hidden className="h-4 w-4" />
            )}
            Excel
          </button>
        ) : null}
        {modes.includes("pdf") ? (
          <button
            type="button"
            disabled={disabled || busy != null}
            onClick={() => void runExport("pdf")}
            className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-lg border border-border bg-white px-3 text-sm font-medium text-foreground transition-colors hover:bg-primary-soft hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy === "pdf" ? (
              <LoaderCircle aria-hidden className="h-4 w-4 animate-spin" />
            ) : (
              <FileDown aria-hidden className="h-4 w-4" />
            )}
            PDF
          </button>
        ) : null}
      </div>
      {error ? (
        <p className="text-xs text-red-600" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
