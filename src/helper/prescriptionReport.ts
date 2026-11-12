import { isTauri } from "@tauri-apps/api/core";
import ExcelJS from "exceljs";
import jsPDF from "jspdf";
import { downloadExcelInTauri } from "../utils/tauriDownload";

export interface PrescriptionRegisterRow {
  invoiceDate?: string;
  invoiceNo?: string;
  doctorName?: string;
  patientName?: string;
  drugsPrescribed?: string;
  qty?: string | number;
  batchNo?: string;
  expiryDate?: string;
  [key: string]: unknown;
}

export interface PrescriptionReportMeta {
  year?: string | number;
  monthLabel?: string;
  search?: string;
  companyName?: string;
  companyAddress?: string;
}

interface ReportColumn {
  label: string;
  weight: number;
  align: "left" | "center" | "right";
  getValue: (row: PrescriptionRegisterRow, index: number) => string;
}

const REPORT_TITLE = "Audit Report";

const asText = (value: unknown): string =>
  value === null || value === undefined || String(value).trim() === ""
    ? "-"
    : String(value);

export const prescriptionReportColumns: ReportColumn[] = [
  {
    label: "No",
    weight: 6,
    align: "center",
    getValue: (_row, index) => String(index + 1),
  },
  {
    label: "Bill Date",
    weight: 15,
    align: "left",
    getValue: (row) => asText(row.invoiceDate),
  },
  {
    label: "Bill No",
    weight: 16,
    align: "left",
    getValue: (row) => asText(row.invoiceNo),
  },
  {
    label: "Doctor Name",
    weight: 22,
    align: "left",
    getValue: (row) => asText(row.doctorName),
  },
  {
    label: "Patient Name",
    weight: 22,
    align: "left",
    getValue: (row) => asText(row.patientName),
  },
  {
    label: "Drug Prescribed",
    weight: 34,
    align: "left",
    getValue: (row) => asText(row.drugsPrescribed),
  },
  {
    label: "Qty",
    weight: 8,
    align: "center",
    getValue: (row) => asText(row.qty),
  },
  {
    label: "Batch No",
    weight: 14,
    align: "left",
    getValue: (row) => asText(row.batchNo),
  },
  {
    label: "Expiry Date",
    weight: 14,
    align: "left",
    getValue: (row) => asText(row.expiryDate),
  },
];

export const buildPrescriptionFilterLabel = (
  meta: PrescriptionReportMeta = {},
) => {
  const parts: string[] = [];
  if (meta.monthLabel) parts.push(meta.monthLabel);
  if (meta.year) parts.push(String(meta.year));
  if (meta.search) parts.push(`Search: "${meta.search}"`);
  return parts.join("  •  ");
};

export const buildPrescriptionFileName = (
  extension: string,
  meta: PrescriptionReportMeta = {},
) => {
  const parts = ["Prescription-Register"];
  if (meta.monthLabel) parts.push(String(meta.monthLabel).replace(/\s+/g, "-"));
  if (meta.year) parts.push(String(meta.year));
  return `${parts.join("-")}.${extension}`;
};

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const getNativeWebView = () =>
  (
    window as Window & {
      ReactNativeWebView?: { postMessage: (message: string) => void };
    }
  ).ReactNativeWebView;

const blobToBase64 = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = String(reader.result);
      resolve(result.split(",")[1] || "");
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

const downloadBlob = async (
  blob: Blob,
  fileName: string,
  nativeMessageType: string,
) => {
  const nativeWebView = getNativeWebView();
  if (nativeWebView) {
    nativeWebView.postMessage(
      JSON.stringify({
        type: nativeMessageType,
        fileName,
        mimeType: blob.type,
        base64: await blobToBase64(blob),
      }),
    );
    return;
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

// ─────────────────────────────────────────────────────────────────────────────
// Excel
// ─────────────────────────────────────────────────────────────────────────────

const HEADER_FILL: ExcelJS.Fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FFEFF3F9" },
};

const THIN_BORDER: Partial<ExcelJS.Borders> = {
  top: { style: "thin", color: { argb: "FFD6DCE6" } },
  left: { style: "thin", color: { argb: "FFD6DCE6" } },
  bottom: { style: "thin", color: { argb: "FFD6DCE6" } },
  right: { style: "thin", color: { argb: "FFD6DCE6" } },
};

export const buildPrescriptionRegisterWorkbook = (
  rows: PrescriptionRegisterRow[],
  meta: PrescriptionReportMeta = {},
) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Caremayam";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("Audit Report");
  const lastColumn = prescriptionReportColumns.length;

  sheet.columns = prescriptionReportColumns.map((column) => ({
    width: column.weight,
  }));

  let rowCursor = 1;

  // Company name (line 1) and address (line 2) at the very top.
  if (meta.companyName) {
    sheet.mergeCells(rowCursor, 1, rowCursor, lastColumn);
    const companyCell = sheet.getCell(rowCursor, 1);
    companyCell.value = meta.companyName;
    companyCell.font = { bold: true, size: 18 };
    companyCell.alignment = { horizontal: "center", vertical: "middle" };
    sheet.getRow(rowCursor).height = 28;
    rowCursor++;
  }

  if (meta.companyAddress) {
    sheet.mergeCells(rowCursor, 1, rowCursor, lastColumn);
    const addressCell = sheet.getCell(rowCursor, 1);
    addressCell.value = meta.companyAddress;
    addressCell.font = { size: 11, color: { argb: "FF4A5568" } };
    addressCell.alignment = { horizontal: "center", vertical: "middle" };
    rowCursor++;
  }

  sheet.mergeCells(rowCursor, 1, rowCursor, lastColumn);
  const titleCell = sheet.getCell(rowCursor, 1);
  titleCell.value = REPORT_TITLE;
  titleCell.font = { bold: true, size: 15 };
  titleCell.alignment = { horizontal: "center", vertical: "middle" };
  sheet.getRow(rowCursor).height = 22;
  rowCursor++;

  sheet.mergeCells(rowCursor, 1, rowCursor, lastColumn);
  const subtitleCell = sheet.getCell(rowCursor, 1);
  subtitleCell.value = buildPrescriptionFilterLabel(meta) || "All Records";
  subtitleCell.font = { bold: true, size: 11, color: { argb: "FF4A5568" } };
  subtitleCell.alignment = { horizontal: "center", vertical: "middle" };
  rowCursor += 2; // leave one blank spacer row

  const headerRow = sheet.getRow(rowCursor);
  headerRow.values = prescriptionReportColumns.map((column) => column.label);
  headerRow.eachCell((cell) => {
    cell.font = { bold: true };
    cell.fill = HEADER_FILL;
    cell.border = THIN_BORDER;
    cell.alignment = { horizontal: "center", vertical: "middle" };
  });
  headerRow.height = 20;
  sheet.views = [{ state: "frozen", ySplit: rowCursor }];

  rows.forEach((row, index) => {
    const dataRow = sheet.addRow(
      prescriptionReportColumns.map((column) => column.getValue(row, index)),
    );
    dataRow.eachCell((cell, columnNumber) => {
      cell.border = THIN_BORDER;
      cell.alignment = {
        horizontal: prescriptionReportColumns[columnNumber - 1].align,
        vertical: "middle",
        wrapText: true,
      };
    });
  });

  return workbook;
};

export const exportPrescriptionRegisterXlsx = async (
  rows: PrescriptionRegisterRow[],
  meta: PrescriptionReportMeta = {},
) => {
  const workbook = buildPrescriptionRegisterWorkbook(rows, meta);
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  const nativeWebView = (
    window as Window & {
      ReactNativeWebView?: {
        postMessage: (message: string) => void;
      };
    }
  ).ReactNativeWebView;

  // React Native WebView
  if (nativeWebView) {
    const bytes = new Uint8Array(buffer);

    let binary = "";

    const chunkSize = 0x8000;

    for (let i = 0; i < bytes.length; i += chunkSize) {
      const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));

      binary += String.fromCharCode(...chunk);
    }

    const base64 = btoa(binary);

    nativeWebView.postMessage(
      JSON.stringify({
        type: "export-income-expense",
        fileName: buildPrescriptionFileName("xlsx", meta),
        base64,
      }),
    );

    return;
  }

  if (isTauri()) {
    await downloadExcelInTauri(buffer, buildPrescriptionFileName("xlsx", meta));
    return;
  }

  await downloadBlob(
    blob,
    buildPrescriptionFileName("xlsx", meta),
    "export-prescription-register",
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// PDF
// ─────────────────────────────────────────────────────────────────────────────

export const exportPrescriptionRegisterPdf = async (
  rows: PrescriptionRegisterRow[],
  meta: PrescriptionReportMeta = {},
) => {
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 28;
  const contentWidth = pageWidth - margin * 2;
  const totalWeight = prescriptionReportColumns.reduce(
    (sum, column) => sum + column.weight,
    0,
  );
  const columnWidths = prescriptionReportColumns.map(
    (column) => (contentWidth * column.weight) / totalWeight,
  );

  const headerHeight = 22;
  const lineHeight = 11;
  const cellPadX = 5;
  const cellPadY = 5;

  let cursorY = margin + 12;

  // Company name (first line) and address (second line).
  if (meta.companyName) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(30);
    doc.text(meta.companyName, pageWidth / 2, cursorY, { align: "center" });
    cursorY += 16;
  }

  if (meta.companyAddress) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text(meta.companyAddress, pageWidth / 2, cursorY, { align: "center" });
    doc.setTextColor(30);
    cursorY += 12;
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(30);
  doc.text(REPORT_TITLE, pageWidth / 2, cursorY, { align: "center" });
  cursorY += 18;

  const filterLabel = buildPrescriptionFilterLabel(meta);
  if (filterLabel) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text(filterLabel, pageWidth / 2, cursorY, { align: "center" });
    doc.setTextColor(30);
    cursorY += 6;
  }

  const drawHeader = (y: number) => {
    doc.setFillColor(239, 243, 249);
    doc.rect(margin, y, contentWidth, headerHeight, "F");
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.5);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(30);
    let x = margin;
    prescriptionReportColumns.forEach((column, index) => {
      doc.rect(x, y, columnWidths[index], headerHeight);
      doc.text(
        column.label,
        x + columnWidths[index] / 2,
        y + headerHeight / 2 + 3,
        {
          align: "center",
        },
      );
      x += columnWidths[index];
    });
    return y + headerHeight;
  };

  let y = drawHeader(cursorY);

  const setBodyFont = () => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(30);
  };

  if (rows.length === 0) {
    setBodyFont();
    doc.setDrawColor(226, 232, 240);
    doc.rect(margin, y, contentWidth, headerHeight);
    doc.text(
      "No prescription register data found.",
      pageWidth / 2,
      y + headerHeight / 2 + 3,
      {
        align: "center",
      },
    );
    y += headerHeight;
  }

  rows.forEach((row, rowIndex) => {
    setBodyFont();
    const cellLines = prescriptionReportColumns.map((column, index) =>
      doc.splitTextToSize(
        column.getValue(row, rowIndex),
        columnWidths[index] - cellPadX * 2,
      ),
    );
    const rowHeight =
      Math.max(1, ...cellLines.map((lines) => lines.length)) * lineHeight +
      cellPadY * 2;

    if (y + rowHeight > pageHeight - margin) {
      doc.addPage();
      y = drawHeader(margin);
      setBodyFont();
    }

    let x = margin;
    prescriptionReportColumns.forEach((column, index) => {
      doc.setDrawColor(226, 232, 240);
      doc.rect(x, y, columnWidths[index], rowHeight);
      const textY = y + cellPadY + lineHeight - 2;
      const textX =
        column.align === "center"
          ? x + columnWidths[index] / 2
          : column.align === "right"
            ? x + columnWidths[index] - cellPadX
            : x + cellPadX;
      doc.text(cellLines[index], textX, textY, { align: column.align });
      x += columnWidths[index];
    });

    y += rowHeight;
  });

  const blob = doc.output("blob");
  await downloadBlob(blob, buildPrescriptionFileName("pdf", meta), "save_pdf");
};

// ─────────────────────────────────────────────────────────────────────────────
// Print
// ─────────────────────────────────────────────────────────────────────────────

export const printPrescriptionRegister = (
  rows: PrescriptionRegisterRow[],
  meta: PrescriptionReportMeta = {},
) => {
  const filterLabel = buildPrescriptionFilterLabel(meta);
  const headerCells = prescriptionReportColumns
    .map((column) => `<th>${escapeHtml(column.label)}</th>`)
    .join("");

  const bodyRows = rows.length
    ? rows
        .map((row, index) => {
          const cells = prescriptionReportColumns
            .map(
              (column) =>
                `<td class="align-${column.align}">${escapeHtml(
                  column.getValue(row, index),
                )}</td>`,
            )
            .join("");
          return `<tr>${cells}</tr>`;
        })
        .join("")
    : `<tr><td class="empty" colspan="${prescriptionReportColumns.length}">No prescription register data found.</td></tr>`;

  const markup = `<!doctype html>
<html mozNoMarginBoxes>
  <head>
    <meta charset="utf-8" />
    <style>
      * { box-sizing: border-box; }
      html, body { margin: 0; padding: 0; background: #ffffff; color: #1f2937; font-family: Arial, Helvetica, sans-serif; }
      /* margin: 0 hides Firefox/Chrome's own header & footer (URL, date, page number). Page margins are drawn by the padding + repeating table header/footer below. */
      @page { size: A4 landscape; margin: 0; }
      .report { padding: 12mm 12mm 0; }
      .report .company-name { font-size: 20px; text-align: center; margin: 0 0 2px; }
      .report .company-address { font-size: 12px; text-align: center; color: #475569; margin: 0 0 6px; }
      .report .report-title { font-size: 16px; text-align: center; margin: 0 0 4px; }
      .report .meta { font-size: 11px; text-align: center; color: #64748b; margin: 0 0 8px; }
      table { width: 100%; border-collapse: collapse; table-layout: fixed; }
      th, td { border: 1px solid #d6dce6; padding: 5px 6px; font-size: 10px; word-wrap: break-word; }
      th { background: #eff3f9; font-weight: 700; text-align: center; }
      .align-center { text-align: center; }
      .align-right { text-align: right; }
      .empty { text-align: center; color: #94a3b8; }
      /* Repeats on every printed page to keep a top/bottom margin while @page margin stays 0. */
      .page-top-spacer th { height: 12mm; border: none; background: transparent; }
      .page-bottom-spacer td { height: 12mm; border: none; background: transparent; }
    </style>
  </head>
  <body>
    <div class="report">
      ${meta.companyName ? `<h1 class="company-name">${escapeHtml(meta.companyName)}</h1>` : ""}
      ${meta.companyAddress ? `<p class="company-address">${escapeHtml(meta.companyAddress)}</p>` : ""}
      <h2 class="report-title">${escapeHtml(REPORT_TITLE)}</h2>
      ${filterLabel ? `<p class="meta">${escapeHtml(filterLabel)}</p>` : ""}
      <table>
        <thead>
          <tr class="page-top-spacer"><th colspan="${prescriptionReportColumns.length}"></th></tr>
          <tr>${headerCells}</tr>
        </thead>
        <tbody>
          ${bodyRows}
        </tbody>
        <tfoot>
          <tr class="page-bottom-spacer"><td colspan="${prescriptionReportColumns.length}"></td></tr>
        </tfoot>
      </table>
    </div>
  </body>
</html>`;

  const frame = document.createElement("iframe");
  frame.setAttribute("aria-hidden", "true");
  frame.style.position = "fixed";
  frame.style.left = "-10000px";
  frame.style.top = "0";
  frame.style.width = "297mm";
  frame.style.height = "210mm";
  frame.style.border = "0";
  frame.style.visibility = "hidden";

  const cleanup = () => {
    window.removeEventListener("afterprint", cleanup);
    frame.remove();
  };

  return new Promise<void>((resolve, reject) => {
    frame.onload = () => {
      const frameWindow = frame.contentWindow;
      if (!frameWindow) {
        cleanup();
        reject(new Error("Unable to open the print window"));
        return;
      }
      window.addEventListener("afterprint", cleanup);
      try {
        frameWindow.focus();
        frameWindow.print();
        setTimeout(() => {
          frame.style.display = "none";
        }, 1000);
        resolve();
      } catch (error) {
        cleanup();
        reject(error);
      }
    };

    frame.srcdoc = markup;
    document.body.appendChild(frame);
  });
};
