import ExcelJS from "exceljs";
import { formatDateDMY } from "./date";
import type { IncomeExpenseEntry } from "../api/featutres/incomeExpenseFeatures/incomeExpenseApi";
import { isTauri } from "@tauri-apps/api/core";
import { downloadExcelInTauri } from "../utils/tauriDownload";

/** ₹ with two decimals; negatives in red so a loss month stands out. */
const AMOUNT_FORMAT = '"₹"#,##0.00;[Red]-"₹"#,##0.00';

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

export interface IncomeExpenseExportOptions {
  /** e.g. "September" */
  monthLabel: string;
  year: number;
  /** Income and expense entries merged; both lists are signed on export. */
  entries: IncomeExpenseEntry[];
  /**
   * Total row count reported by the API. When it exceeds the number of rows
   * actually fetched, the sheet says so instead of quietly presenting a
   * partial total as if it were the whole month.
   */
  reportedTotal?: number;
  fileName?: string;
}

/**
 * Builds the formatted workbook for a single month's income/expense
 * breakdown: a merged month+year title, a No/Date/Title/Type/Amount table, and
 * a bold Final Total row. Kept separate from the download so it can be
 * rendered or tested without a DOM.
 */
export const buildIncomeExpenseWorkbook = ({
  monthLabel,
  year,
  entries,
  reportedTotal,
}: IncomeExpenseExportOptions) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Medical Billing Software";
  workbook.created = new Date();

  const ordered = [...entries].sort((a, b) =>
    a.date === b.date
      ? String(a.id).localeCompare(String(b.id))
      : a.date.localeCompare(b.date),
  );

  const incomeRows = ordered.filter((entry) => entry.type === "income");
  const expenseRows = ordered.filter((entry) => entry.type === "expense");

  const buildSheet = (
    sheetName: string,
    rows: IncomeExpenseEntry[],
    sectionTitle: string,
  ) => {
    const sheet = workbook.addWorksheet(sheetName, {
      views: [{ state: "frozen", ySplit: 4 }],
    });

    sheet.columns = [
      { key: "no", width: 8 },
      { key: "date", width: 18 },
      { key: "title", width: 46 },
      { key: "type", width: 14 },
      { key: "amount", width: 20 },
    ];

    // ── Title block ────────────────────────────────────────────────────────
    sheet.mergeCells("A1:E1");
    const titleCell = sheet.getCell("A1");
    titleCell.value = `${monthLabel} ${year}`;
    titleCell.font = { bold: true, size: 16 };
    titleCell.alignment = { horizontal: "center", vertical: "middle" };
    sheet.getRow(1).height = 26;

    sheet.mergeCells("A2:E2");
    const subtitleCell = sheet.getCell("A2");
    subtitleCell.value = sectionTitle;
    subtitleCell.font = { bold: true, size: 12, color: { argb: "FF4A5568" } };
    subtitleCell.alignment = { horizontal: "center" };

    // ── Header row ─────────────────────────────────────────────────────────
    const headerRow = sheet.getRow(4);
    headerRow.values = ["No", "Date", "Title", "Type", "Amount"];
    headerRow.eachCell((cell) => {
      cell.font = { bold: true };
      cell.fill = HEADER_FILL;
      cell.border = THIN_BORDER;
      cell.alignment = { horizontal: "center", vertical: "middle" };
    });

    let sectionTotal = 0;

    rows.forEach((entry, index) => {
      const isIncome = entry.type === "income";
      const signedAmount = isIncome ? entry.amount : -entry.amount;
      sectionTotal += signedAmount;

      const row = sheet.addRow([
        index + 1,
        formatDateDMY(entry.date),
        entry.bill_no
          ? `${entry.description} (${entry.bill_no})`
          : entry.description || "-",
        isIncome ? "Income" : "Expense",
        signedAmount,
      ]);

      row.eachCell((cell, columnNumber) => {
        cell.border = THIN_BORDER;
        if (columnNumber === 1) cell.alignment = { horizontal: "center" };
        if (columnNumber === 4) {
          cell.alignment = { horizontal: "center" };
          cell.font = {
            bold: true,
            color: { argb: isIncome ? "FF0B7A2E" : "FFB42318" },
          };
        }
        if (columnNumber === 5) {
          cell.numFmt = AMOUNT_FORMAT;
          cell.alignment = { horizontal: "right" };
        }
      });
    });

    // ── Total row ──────────────────────────────────────────────────────────
    const totalRowNumber = sheet.rowCount + 2; // leave one blank spacer row
    const totalRow = sheet.getRow(totalRowNumber);
    totalRow.getCell(1).value = `${sectionTitle} Total`;
    sheet.mergeCells(totalRowNumber, 1, totalRowNumber, 4);
    totalRow.getCell(1).font = { bold: true, size: 12 };
    totalRow.getCell(1).alignment = { horizontal: "right" };

    const totalCell = totalRow.getCell(5);
    totalCell.value = sectionTotal;
    totalCell.numFmt = AMOUNT_FORMAT;
    totalCell.font = { bold: true, size: 12 };
    totalCell.alignment = { horizontal: "right" };

    totalRow.eachCell((cell, columnNumber) => {
      cell.border = {
        ...THIN_BORDER,
        top: { style: "double", color: { argb: "FF4A5568" } },
      };
      if (columnNumber !== 5) cell.fill = HEADER_FILL;
    });
  };

  // One sheet per view: All, Income, Expense.
  buildSheet("All", ordered, "All Transactions");
  buildSheet("Income", incomeRows, "Income Transactions");
  buildSheet("Expense", expenseRows, "Expense Transactions");

  return workbook;
};

/** Builds the workbook and hands it to the browser as a .xlsx download. */
// export const downloadIncomeExpenseXlsx = async (
//   options: IncomeExpenseExportOptions,
// ) => {
//   const { monthLabel, year, fileName } = options;

//   const workbook = buildIncomeExpenseWorkbook(options);
//   const buffer = await workbook.xlsx.writeBuffer();
//   const blob = new Blob([buffer], {
//     type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
//   });

//   const safeMonth = monthLabel.replace(/\s+/g, "-");
//   const url = URL.createObjectURL(blob);
//   const link = document.createElement("a");
//   link.href = url;
//   link.download = fileName ?? `Income-Expense-Report-${safeMonth}-${year}.xlsx`;
//   document.body.appendChild(link);
//   link.click();
//   link.remove();
//   URL.revokeObjectURL(url);
// };

export const downloadIncomeExpenseXlsx = async (
  options: IncomeExpenseExportOptions,
) => {
  const { monthLabel, year, fileName } = options;

  const workbook = buildIncomeExpenseWorkbook(options);

  const buffer = await workbook.xlsx.writeBuffer();

  const safeMonth = monthLabel.replace(/\s+/g, "-");

  const finalFileName =
    fileName ?? `Income-Expense-Report-${safeMonth}-${year}.xlsx`;

  const nativeWebView = (
    window as Window & {
      ReactNativeWebView?: {
        postMessage: (message: string) => void;
      };
    }
  ).ReactNativeWebView;

  // ==========================================
  // React Native WebView
  // ==========================================
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
        fileName: finalFileName,
        base64,
      }),
    );

    return;
  }

  if (isTauri()) {
    await downloadExcelInTauri(buffer, finalFileName);
    return;
  }

  // ==========================================
  // Normal Browser
  // ==========================================
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");

  link.href = url;
  link.download = finalFileName;

  document.body.appendChild(link);

  link.click();

  link.remove();

  URL.revokeObjectURL(url);
};
