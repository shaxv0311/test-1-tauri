import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import {
  getPrintCss,
  getPrintTemplate,
  renderPrintMarkup,
} from "../components/templates/printTemplate";
import { AnyPrintData, PrintDocType } from "../utils/type";
import { isTauri } from "@tauri-apps/api/core";
import { downloadPdfInTauri } from "../utils/tauriDownload";
import { sharePdfInTauri } from "../utils/tauriPdfShare";
import { printFile } from "tauri-plugin-printer";

export type PrintFormat = "a4" | "thermal";

/** 80mm roll: 72mm printable area, 4mm bleed on each side. */
const THERMAL_WIDTH_MM = 80;
const THERMAL_CONTENT_WIDTH_MM = 72;

/** A4 is 210mm wide; the on-screen preview renders at 794px (96dpi). */
const A4_WIDTH_MM = 210;

/** CSS reference pixels per millimetre at 96dpi. */
const CSS_PX_PER_MM = 96 / 25.4;

const getReactNativeWebView = () =>
  (
    window as Window & {
      ReactNativeWebView?: { postMessage: (message: string) => void };
    }
  ).ReactNativeWebView;

const postPdfToReactNative = async (
  action: "save_pdf" | "share_pdf",
  fileName: string,
  pdf: Blob,
) => {
  const reactNativeWebView = getReactNativeWebView();
  if (!reactNativeWebView) {
    return false;
  }
  const base64 = await blobToBase64(pdf);
  reactNativeWebView.postMessage(
    JSON.stringify({
      type: action,
      fileName,
      mimeType: "application/pdf",
      base64,
    }),
  );
  return true;
};

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

export const createReceiptPdf = async (
  title: string,
  data: AnyPrintData,
  format: PrintFormat = "a4",
  docType: PrintDocType = "invoice",
) => {
  const isThermal = format === "thermal";
  const receipt = document.createElement("div");
  receipt.className = isThermal
    ? "receipt-print-root receipt-print-root-thermal"
    : "receipt-print-root";
  receipt.style.position = "fixed";
  receipt.style.left = "-10000px";
  receipt.style.top = "0";
  receipt.style.width = isThermal ? `${THERMAL_CONTENT_WIDTH_MM}mm` : "794px";
  // The template CSS is scoped to .receipt-print-root, so it has to be
  // injected here too or the PDF would render completely unstyled.
  receipt.innerHTML =
    `<style>${getPrintCss(isThermal)}</style>` +
    getPrintTemplate(docType, isThermal)(title, data as any);
  document.body.appendChild(receipt);

  try {
    const scale = 2;
    const canvas = await html2canvas(receipt, {
      scale,
      backgroundColor: "#ffffff",
      useCORS: true,
    });

    if (isThermal) {
      // Roll printers need one page as tall as the content — never paginate.
      const contentHeightMm = canvas.height / scale / CSS_PX_PER_MM;
      const pdf = new jsPDF({
        unit: "mm",
        format: [THERMAL_WIDTH_MM, contentHeightMm],
      });
      pdf.addImage(
        canvas.toDataURL("image/png"),
        "PNG",
        0,
        0,
        THERMAL_WIDTH_MM,
        contentHeightMm,
      );
      return pdf.output("blob");
    }

    const pdf = new jsPDF({ unit: "pt", format: "a4" });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imageHeight = (canvas.height * pageWidth) / canvas.width;
    const image = canvas.toDataURL("image/png");
    let offset = 0;

    while (offset < imageHeight) {
      if (offset > 0) pdf.addPage();
      pdf.addImage(image, "PNG", 0, -offset, pageWidth, imageHeight);
      offset += pageHeight;
    }

    return pdf.output("blob");
  } finally {
    receipt.remove();
  }
};

export const printReceiptToTauriPrinter = async (
  printerName: string,
  title: string,
  data: AnyPrintData,
  format: PrintFormat = "a4",
  docType: PrintDocType = "invoice",
  copies = 1,
) => {
  if (!isTauri() || /android/i.test(navigator.userAgent)) {
    throw new Error("Windows Tauri printing is not available");
  }

  const pdf = await createReceiptPdf(title, data, format, docType);
  const file = await pdf.arrayBuffer();

  // Send each copy to the selected printer.
  // The plugin documents in-memory PDF printing by printer name.
  for (let copy = 0; copy < copies; copy++) {
    await printFile({
      file,
      name: printerName,
    });
  }
};

export const downloadReceiptPdf = async (
  fileName: string,
  title: string,
  data: AnyPrintData,
  format: PrintFormat = "a4",
  docType: PrintDocType = "invoice",
) => {
  const pdf = await createReceiptPdf(title, data, format, docType);
  if (await postPdfToReactNative("save_pdf", fileName, pdf)) {
    return;
  }

  if (isTauri()) {
    const saved = await downloadPdfInTauri(pdf, fileName);

    if (!saved) {
      return;
    }

    return;
  }
  const url = URL.createObjectURL(pdf);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

/**
 * Prints the receipt through the browser's own print dialog.
 *
 * A hidden iframe is used rather than `window.print()` on the app shell: the
 * template CSS is scoped to `.receipt-print-root`, so a dedicated document is
 * the only way to get A4 vs 80mm page setup without restyling the whole app.
 */
export const printReceipt = async (
  title: string,
  data: AnyPrintData,
  format: PrintFormat = "a4",
  docType: PrintDocType = "invoice",
): Promise<void> => {
  // Generate PDF using your existing PDF generation function
  const pdf = await createReceiptPdf(title, data, format, docType);

  const fileName = `${title.replace(/[^a-z0-9]/gi, "_")}.pdf`;

  // 1. React Native bridge
  if (await postPdfToReactNative("share_pdf", fileName, pdf)) {
    return;
  }

  // 2. Android Tauri: open native share sheet
  if (isTauri() && /android/i.test(navigator.userAgent)) {
    await sharePdfInTauri(pdf, fileName, title);
    return;
  }

  // 3. Windows desktop: use existing iframe printing
  const isThermal = format === "thermal";

  const frame = document.createElement("iframe");
  frame.setAttribute("aria-hidden", "true");

  frame.style.position = "fixed";
  frame.style.left = "-10000px";
  frame.style.top = "0";
  frame.style.width = isThermal ? `${THERMAL_WIDTH_MM}mm` : `${A4_WIDTH_MM}mm`;
  frame.style.height = "297mm";
  frame.style.border = "0";
  frame.style.visibility = "hidden";

  const markup = `<style>${getPrintCss(isThermal)}</style>
${renderPrintMarkup(title, data, docType, isThermal)}`;

  const pageSetup = isThermal
    ? "@page { size: 80mm auto; margin: 0; }"
    : "@page { size: A4; margin: 0; }";

  const documentHtml = `<!doctype html>
<html mozNoMarginBoxes>
  <head>
    <meta charset="utf-8" />
    <style>
      html, body { margin: 0; padding: 0; background: #ffffff; }
      ${pageSetup}
    </style>
  </head>
  <body>${markup}</body>
</html>`;

  const cleanup = () => {
    window.removeEventListener("afterprint", cleanup);
    frame.remove();
  };

  return new Promise<void>((resolve, reject) => {
    frame.onload = () => {
      const frameWindow = frame.contentWindow;
      const frameDocument = frame.contentDocument;

      if (!frameWindow || !frameDocument) {
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

    frame.srcdoc = documentHtml;
    document.body.appendChild(frame);
  });
};

export const shareReceiptPdf = async (
  fileName: string,
  title: string,
  data: AnyPrintData,
  format: PrintFormat = "a4",
  docType: PrintDocType = "invoice",
) => {
  const pdf = await createReceiptPdf(title, data, format, docType);

  // React Native WebView
  if (await postPdfToReactNative("share_pdf", fileName, pdf)) {
    return;
  }

  // Tauri Windows / Android
  if (isTauri()) {
    await sharePdfInTauri(pdf, fileName, title);
    return;
  }

  // Normal browser
  if (!navigator.share || !navigator.canShare) {
    throw new Error("Sharing is not supported on this device");
  }

  const pdfFile = new File([pdf], fileName, {
    type: "application/pdf",
  });

  if (!navigator.canShare({ files: [pdfFile] })) {
    throw new Error("PDF sharing is not supported on this device");
  }

  await navigator.share({
    title,
    files: [pdfFile],
  });
};
