import { useState } from "react";
import { Download, Printer, Share2 } from "lucide-react";

import Button from "../../../components/ui/Button";
import CloseIcon from "../../../components/ui/CloseIcon";
import { PrintPage } from "../../../components/ui/printPage";
import { ThermalPrintPage } from "../../../components/ui/thermalPrintPage";
import PrinterListModal from "../../quotation/component/PrinterListModal";
import { useGetShopQuery } from "../../../api/featutres/shopFeatures/shopApi";
import { useGetSalesReturnByIdQuery } from "../../../api/featutres/salesReturnFeatures/salesReturnApi";
import { setToastMessage } from "../../../helper/helper";
import { formatDateDMY } from "../../../helper/date";
import {
  downloadReceiptPdf,
  printReceipt,
  PrintFormat,
  shareReceiptPdf,
} from "../../../helper/pdf";
import { SalesReturnPrintData } from "../../../utils/type";

const DOC_TITLE = "SALES RETURN";

/**
 * Print preview for a single sales return.
 *
 * Mirrors PrintViewModal (same A4/thermal toggle, Save PDF / Print / Share)
 * but renders the price-free sales return layout — a return carries no rate
 * per item, so there is no money total to show.
 *
 * `id` is the only input: the detail is refetched here so the preview always
 * reflects what is stored, not a stale list row.
 */
export default function SalesReturnPrintViewModal({
  isOpen,
  onClose,
  id,
}: {
  isOpen: boolean;
  onClose: () => void;
  id: number;
}) {
  const [isSaving, setIsSaving] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [showPrinterModal, setShowPrinterModal] = useState(false);
  const [printFormat, setPrintFormat] = useState<PrintFormat>("a4");

  const { data: shopdata } = useGetShopQuery({});
  const { data, isLoading } = useGetSalesReturnByIdQuery(id, {
    skip: !isOpen || !id,
  });

  const salesReturn = data?.salesReturn;
  const rawItems = (salesReturn?.items ?? []) as any[];

  const items = rawItems.map((item) => ({
    product_name: item?.product_name ?? `Product #${item?.productId}`,
    batch_no: item?.batch_no ?? null,
    quantity: Number(item?.quantity ?? 0),
    expiry_date: item.expiry_date ?? ""
  }));

  const printData: SalesReturnPrintData = {
    shop: {
      shop_name: shopdata?.shop?.shop_name || "",
      phone: shopdata?.shop?.phone || "",
      email: shopdata?.shop?.email || "",
      address: shopdata?.shop?.address || "",
      gstin: shopdata?.shop?.gstin || "",
      logo: shopdata?.shop?.logo,
    },
    return: {
      no: salesReturn?.invoice_no || "-",
      return_date: salesReturn?.createdAt
        ? formatDateDMY(salesReturn.createdAt)
        : "-",
      patient_name: salesReturn?.patient_name ?? null,
      doctor_name: salesReturn?.doctor_name ?? null,
      items,
      totalPieces: items.reduce((sum, item) => sum + item.quantity, 0),
    },
  };

  // Desktop can address a specific printer; the web build only has the
  // browser's own print dialog, which reads the @page size we render.
  const isElectronDesktop = Boolean(window.electronAPI?.savePDF);

  const fileName = `${salesReturn?.invoice_no || "sales-return"}.pdf`;

  const handlePrint = async () => {
    if (isPrinting || isLoading) return;

    if (!isElectronDesktop) {
      setIsPrinting(true);
      try {
        await printReceipt(DOC_TITLE, printData, printFormat, "salesReturn");
      } catch (error: any) {
        setToastMessage("error", error?.message || "Failed to open print");
      } finally {
        setIsPrinting(false);
      }
      return;
    }

    setShowPrinterModal(true);
  };

  const handleSavePdf = async () => {
    if (isSaving) return;
    setIsSaving(true);

    // Without Electron there is no native save dialog, so fall back to a
    // browser download of the same PDF.
    if (!window.electronAPI?.savePDF) {
      try {
        await downloadReceiptPdf(
          fileName,
          DOC_TITLE,
          printData,
          printFormat,
          "salesReturn",
        );
        setToastMessage("success", "PDF downloaded successfully");
      } catch (error: any) {
        setToastMessage("error", error?.message || "Failed to download PDF");
      } finally {
        setIsSaving(false);
      }
      return;
    }

    try {
      const result = await window.electronAPI.savePDF({
        fileName,
        title: DOC_TITLE,
        data: printData,
        format: printFormat,
        docType: "salesReturn",
      });

      if (result?.success) {
        setToastMessage("success", "PDF saved successfully");
      } else {
        setToastMessage("error", "Failed to save PDF");
      }
    } catch (error: any) {
      // A 401 is already handled globally (toast + redirect to login).
      if (error?.status === 401) return;
      setToastMessage("error", error?.message || "Failed to save PDF");
    } finally {
      setIsSaving(false);
    }
  };

  const handleShare = async () => {
    if (isLoading) return;

    try {
      await shareReceiptPdf(
        fileName,
        DOC_TITLE,
        printData,
        printFormat,
        "salesReturn",
      );
    } catch (error: any) {
      // Dismissing the OS share sheet rejects with AbortError — not a failure.
      if (error?.name !== "AbortError") {
        setToastMessage("error", "Failed to share");
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="print-view-overlay">
      <div className="print-view-panel">
        <div className="print-view-header">
          <div className="print-view-header-top">
            <h3 className="print-view-title">Sales Return Details</h3>

            <div className="print-view-close-wrap">
              <CloseIcon onClose={onClose} />
            </div>
          </div>

          {/* A4 / Thermal format switch */}
          {isElectronDesktop && <div className="print-view-format-toggle">
            <button
              type="button"
              className={
                printFormat === "a4"
                  ? "print-view-format-btn print-view-format-btn-active"
                  : "print-view-format-btn"
              }
              onClick={() => setPrintFormat("a4")}
            >
              A4
            </button>
            {/* <button
              type="button"
              className={
                printFormat === "thermal"
                  ? "print-view-format-btn print-view-format-btn-active"
                  : "print-view-format-btn"
              }
              onClick={() => setPrintFormat("thermal")}
            >
              Thermal
            </button> */}
          </div>
          }
          <div className="print-view-actions">
            <Button
              variant="primary"
              type="button"
              className="print-view-action-btn"
              onClick={handleSavePdf}
              loading={isSaving}
              disabled={isSaving || isLoading}
            >
              <Download size={14} />
              <span>Save PDF</span>
            </Button>
            {isElectronDesktop ?
              <Button
                type="button"
                variant="others"
                className="print-view-action-btn print-view-action-btn-dark"
                onClick={handlePrint}
                loading={isPrinting}
                disabled={isPrinting || isLoading}
              >
                <Printer size={14} />
                <span>Print</span>
              </Button> :
              <Button
                type="button"
                variant="others"
                className="print-view-action-btn print-view-action-btn-dark"
                onClick={handleShare}
                disabled={isLoading}
              >
                <Share2 size={14} />
                <span>Share</span>
              </Button>
            }

            {/* Sharing is a browser capability, so it only makes sense on web. */}
            {/* {!isElectronDesktop && (
              <Button
                type="button"
                variant="others"
                className="print-view-action-btn"
                onClick={handleShare}
                disabled={isLoading}
              >
                <Share2 size={14} />
                <span>Share</span>
              </Button>
            )} */}
          </div>
        </div>

        {isLoading ? (
          <div className="print-view-loading">
            <span className="print-view-loading-text">Loading details...</span>
          </div>
        ) : salesReturn ? (
          <div
            className={
              printFormat === "thermal"
                ? "print-view-body print-view-body-thermal"
                : "print-view-body"
            }
          >
            {printFormat === "thermal" ? (
              <ThermalPrintPage
                title={DOC_TITLE}
                data={printData}
                docType="salesReturn"
              />
            ) : (
              <PrintPage
                title={DOC_TITLE}
                data={printData}
                docType="salesReturn"
              />
            )}
          </div>
        ) : (
          <div className="print-view-loading">
            <span className="print-view-loading-text">
              Failed to load details.
            </span>
          </div>
        )}
      </div>

      {showPrinterModal && (
        <PrinterListModal
          isOpen={showPrinterModal}
          onClose={() => setShowPrinterModal(false)}
          title={DOC_TITLE}
          data={printData}
          format={printFormat}
          docType="salesReturn"
        />
      )}
    </div>
  );
}