import { AnyPrintData, PrintDocType } from "../../utils/type";
import {
  RECEIPT_CSS,
  ReceiptTemplate,
} from "./receipt_templates";
import {
  SalesReturnReceiptTemplate,
  SalesReturnThermalTemplate,
} from "./sales_return_templates";
import {
  PurchaseReturnReceiptTemplate,
  PurchaseReturnThermalTemplate,
} from "./purchase_return_templates";
import {
  THERMAL_RECEIPT_CSS,
  ThermalReceiptTemplate,
} from "./thermal_templates";

/**
 * Single place that decides which template renders a document.
 *
 * The renderer (helper/pdf.ts) and the Electron main process (ipc/print.ts)
 * both build their offscreen document from this, so a sales return prints the
 * same layout whichever path the user takes — print, save PDF or download.
 * Keeping the mapping here is what stops those two drifting apart.
 *
 * Note the return templates deliberately reuse the invoice CSS: the shop
 * header, meta block, table and totals classes are shared, and only the
 * columns differ.
 */
export const getPrintTemplate = (
  docType: PrintDocType | undefined,
  isThermal: boolean,
) => {
  if (docType === "salesReturn") {
    return isThermal
      ? SalesReturnThermalTemplate
      : SalesReturnReceiptTemplate;
  }

  if (docType === "purchaseReturn") {
    return isThermal
      ? PurchaseReturnThermalTemplate
      : PurchaseReturnReceiptTemplate;
  }

  return isThermal ? ThermalReceiptTemplate : ReceiptTemplate;
};

/**
 * The @page size has to live in the stylesheet, so the format decides which
 * stylesheet is injected rather than swapping a rule on one shared sheet.
 */
export const getPrintCss = (isThermal: boolean) =>
  isThermal ? THERMAL_RECEIPT_CSS : RECEIPT_CSS;

/**
 * Builds the offscreen document body.
 *
 * Every rule in the template CSS is scoped to `.receipt-print-root`, so the
 * markup must sit inside that class or nothing matches and the output is
 * unstyled HTML.
 */
export const renderPrintMarkup = (
  title: string,
  data: AnyPrintData,
  docType: PrintDocType | undefined,
  isThermal: boolean,
) =>
  `<div class="receipt-print-root${
    isThermal ? " receipt-print-root-thermal" : ""
  }">${getPrintTemplate(docType, isThermal)(title, data as any)}</div>`;