import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

export type ExportColumn = {
  header: string;
  key: string;
};

export type ExportCell = string | number | null | undefined;
export type ExportRow = Record<string, ExportCell>;

function cellText(value: ExportCell): string {
  if (value == null) {
    return "";
  }
  return String(value);
}

function stampFilename(base: string, extension: string): string {
  const safe = base.replace(/[^\w.-]+/g, "_").replace(/_+/g, "_");
  const stamp = new Date().toISOString().slice(0, 10);
  return `${safe}_${stamp}.${extension}`;
}

export function exportRowsToExcel(
  filename: string,
  columns: ExportColumn[],
  rows: ExportRow[],
): void {
  const sheetRows = rows.map((row) => {
    const next: Record<string, string | number> = {};
    for (const column of columns) {
      const value = row[column.key];
      next[column.header] =
        value == null ? "" : typeof value === "number" ? value : String(value);
    }
    return next;
  });

  const worksheet = XLSX.utils.json_to_sheet(sheetRows, {
    header: columns.map((column) => column.header),
  });
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Export");
  XLSX.writeFile(workbook, stampFilename(filename, "xlsx"));
}

export function exportRowsToPdf(
  filename: string,
  title: string,
  columns: ExportColumn[],
  rows: ExportRow[],
): void {
  const doc = new jsPDF({
    orientation: columns.length > 5 ? "landscape" : "portrait",
    unit: "pt",
    format: "a4",
  });

  doc.setFontSize(14);
  doc.text(title, 40, 36);

  autoTable(doc, {
    startY: 48,
    head: [columns.map((column) => column.header)],
    body: rows.map((row) => columns.map((column) => cellText(row[column.key]))),
    styles: {
      fontSize: 8,
      cellPadding: 4,
    },
    headStyles: {
      fillColor: [234, 88, 12],
      textColor: 255,
    },
  });

  doc.save(stampFilename(filename, "pdf"));
}

export function exportMatrixToPdf(
  filename: string,
  title: string,
  subtitle: string | null,
  head: string[],
  body: string[][],
): void {
  const doc = new jsPDF({
    orientation: head.length > 4 ? "landscape" : "portrait",
    unit: "pt",
    format: "a4",
  });

  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(title, 40, 36);
  let startY = 48;
  if (subtitle) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(subtitle, 40, 52);
    doc.setTextColor(0);
    startY = 64;
  }

  autoTable(doc, {
    startY,
    head: [head],
    body,
    styles: {
      fontSize: 9,
      cellPadding: 8,
      halign: "center",
      valign: "middle",
      lineColor: [214, 211, 209],
      lineWidth: 0.5,
      minCellHeight: 28,
    },
    headStyles: {
      fillColor: [234, 88, 12],
      textColor: 255,
      fontStyle: "bold",
      fontSize: 9,
      halign: "center",
    },
    bodyStyles: {
      textColor: [28, 25, 23],
    },
    alternateRowStyles: {
      fillColor: [255, 247, 237],
    },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 36 },
    },
  });

  doc.save(stampFilename(filename, "pdf"));
}

export type ExamSchedulePdfSection = {
  dateLabel: string;
  rows: Array<{
    index: number;
    course: string;
    start: string;
    duration: string;
    note: string;
  }>;
};

export function exportExamScheduleGridToPdf(
  filename: string,
  title: string,
  subtitle: string | null,
  sections: ExamSchedulePdfSection[],
): void {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "pt",
    format: "a4",
  });

  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(title, 40, 36);
  let cursorY = 48;
  if (subtitle) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(subtitle, 40, 52);
    doc.setTextColor(0);
    cursorY = 64;
  }

  for (const section of sections) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(section.dateLabel, 40, cursorY);
    cursorY += 8;

    autoTable(doc, {
      startY: cursorY,
      head: [["#", "Course", "Start", "Duration", "Note"]],
      body: section.rows.map((row) => [
        String(row.index),
        row.course,
        row.start,
        row.duration,
        row.note,
      ]),
      styles: {
        fontSize: 9,
        cellPadding: 7,
        halign: "center",
        valign: "middle",
        lineColor: [214, 211, 209],
        lineWidth: 0.5,
        minCellHeight: 24,
      },
      headStyles: {
        fillColor: [234, 88, 12],
        textColor: 255,
        fontStyle: "bold",
        fontSize: 9,
      },
      alternateRowStyles: {
        fillColor: [255, 247, 237],
      },
      columnStyles: {
        0: { cellWidth: 28, fontStyle: "bold" },
        1: { halign: "left" },
        4: { halign: "left" },
      },
    });

    const last = (doc as jsPDF & { lastAutoTable?: { finalY: number } })
      .lastAutoTable;
    cursorY = (last?.finalY ?? cursorY) + 24;
  }

  doc.save(stampFilename(filename, "pdf"));
}

export async function fetchAllPaginatedItems<TItem>(
  fetchPage: (
    page: number,
    limit: number,
  ) => Promise<{ items: TItem[]; pagination: { totalPages: number } }>,
  limit = 100,
): Promise<TItem[]> {
  const items: TItem[] = [];
  let page = 1;
  let totalPages = 1;

  while (page <= totalPages) {
    const response = await fetchPage(page, limit);
    items.push(...response.items);
    totalPages = Math.max(1, response.pagination.totalPages);
    page += 1;
    if (response.items.length === 0) {
      break;
    }
  }

  return items;
}
