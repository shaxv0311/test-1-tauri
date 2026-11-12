import { useState } from "react";
import { Download, Printer, Share2 } from "lucide-react";
import { formatDateDMY } from "../../helper/date";
import { useGetInvoiceByIdQuery } from "../../api/featutres/invoiceFeatures/invoiceApi";
import { useGetQuotationByIdQuery } from "../../api/featutres/quotationFeatures/quotationApi";
import { useGetPickupOrderByIdQuery } from "../../api/featutres/orderFeatures/pickupOrderApi";
import { useGetDeliveryOrderByIdQuery } from "../../api/featutres/orderFeatures/deliveryOrderApi";
import { setToastMessage } from "../../helper/helper";
import { ModalProps } from "../../utils/type";
import Button from "./Button";
import CloseIcon from "./CloseIcon";
import PrinterListModal from "../../modules/quotation/component/PrinterListModal";
import { PrintPage } from "./printPage";
import { ThermalPrintPage } from "./thermalPrintPage";
import { useGetShopQuery } from "../../api/featutres/shopFeatures/shopApi";
import { useCalculateAction } from "../../hooks/useCalculateAction";
import {
  downloadReceiptPdf,
  printReceipt,
  PrintFormat,
  shareReceiptPdf,
} from "../../helper/pdf";

export default function PrintViewModal({
  onClose,
  isOpen,
  data,
  id,
  type = "quotation",
}: ModalProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [showPrinterModal, setShowPrinterModal] = useState(false);
  const [printFormat, setPrintFormat] = useState<PrintFormat>("a4");
  const { data: shopdata } = useGetShopQuery({});

  if (!isOpen) {
    return null;
  }

  const shouldFetch = isOpen && !!id;
  const { data: quotationData, isLoading: isQuotationLoading } =
    useGetQuotationByIdQuery(id ?? 0, {
      skip: !shouldFetch || type !== "quotation",
    });
  const { data: invoiceData, isLoading: isInvoiceLoading } =
    useGetInvoiceByIdQuery(id ?? 0, {
      skip: !shouldFetch || type !== "invoice",
    });
  const { data: pickupData, isLoading: isPickupLoading } =
    useGetPickupOrderByIdQuery(id ?? 0, {
      skip: !shouldFetch || type !== "pickup",
    });
  const { data: deliveryData, isLoading: isDeliveryLoading } =
    useGetDeliveryOrderByIdQuery(id ?? 0, {
      skip: !shouldFetch || type !== "delivery",
    });

  const details =
    data ??
    quotationData?.quotation ??
    invoiceData?.invoice ??
    pickupData?.order ??
    deliveryData?.order ??
    null;

  const rawItems = details?.items || [];
  const items = rawItems.map((item: any) => ({
    product_name: item?.product_name,
    quantity: Number(item?.quantity ?? 1),
    price: Number(item?.price ?? 0),
    expiry_date: item.expiry_date ?? "",
    serial_no: item.serial_no ?? item?.batch_no ?? "",
  }));

  const calc = useCalculateAction();

  // `details.gst` is the header-level percentage; a saved invoice stores the
  // real rate per line, so prefer that when it is there.
  const gstPercentage = Number(
    rawItems[0]?.gst ?? details?.gst ?? details?.gst_percentage ?? 0,
  );

  /**
   * Uses the per-line `total`/`cgst`/`sgst` the API stored, so the printed
   * arithmetic reconciles with the saved `total_amount`. Falls back to the
   * live calculation for drafts that have no stored line totals.
   */
  const { subtotal, gstAmount, cgstAmount, sgstAmount, discountAmount } =
    calc.invCal.storedTotals(
      rawItems.map((item: any) => ({
        quantity: Number(item?.quantity ?? 0),
        price: Number(item?.price ?? 0),
        gst: Number(item?.gst ?? 0),
        total: item?.total,
        cgst: item?.cgst,
        sgst: item?.sgst,
      })),
      {
        gstPercentage,
        // A stored document with no tax lines was saved with tax off.
        enabled: gstPercentage > 0,
        discountType: details?.discount_type ?? "none",
        discount: details?.discount,
      },
    );

  // The stored total is authoritative — never re-derive it from the lines.
  const finalAmount = Number(details?.total_amount);

  const printData = {
    shop: {
      shop_name: shopdata?.shop?.shop_name || "",
      phone: shopdata?.shop?.phone || "",
      email: shopdata?.shop?.email || "",
      address: shopdata?.shop?.address || "",
      gstin: shopdata?.shop?.gstin || "",
      logo: shopdata?.shop?.logo,
    },
    customer: {
      name: details?.customerName || details?.patient_name || "",
      phone: details?.phone_no || details?.phone_number || "",
      email: details?.email || "",
      address: details?.address || "",
      doctor: details?.doctor_name || "",
    },
    bill: {
      no:
        details?.quotation_no ||
        details?.invoice_no ||
        (type === "delivery"
          ? `DELIVERY-${String(details?.id ?? 1).padStart(4, "0")}`
          : `PICKUP-${String(details?.id ?? 1).padStart(4, "0")}`),
      invoice_date:
        details?.issued_date ||
        details?.invoice_date ||
        details?.orderDate ||
        details?.createdAt
          ? formatDateDMY(
              details?.issued_date ||
                details?.invoice_date ||
                details?.orderDate ||
                details?.createdAt,
            )
          : "-",
      items,
      subtotal,
      gstAmount,
      cgstAmount,
      sgstAmount,
      finalAmount,
      gstPercentage,
      discountAmount,
      discountLabel: calc.discount.label(
        details?.discount_type,
        details?.discount,
      ),
      deliveryCharge: Number(details?.delivery_charge ?? 0),
    },
  };

  const isLoading =
    type === "quotation"
      ? isQuotationLoading
      : type === "pickup"
        ? isPickupLoading
        : type === "delivery"
          ? isDeliveryLoading
          : isInvoiceLoading;

  const isElectronDesktop = Boolean(window.electronAPI?.savePDF);

  const isBillLike =
    type === "invoice" || type === "pickup" || type === "delivery";

  const documentTitle = isBillLike ? "INVOICE / BILL" : "QUOTATION";

  const handlePrint = async () => {
    if (isPrinting || isLoading) return;

    // Desktop picks a specific printer; the web build only has the browser's
    // own print dialog, which reads the @page size we render.
    // if (!isElectronDesktop) {
    //   setIsPrinting(true);
    //   try {
    //     await printReceipt(documentTitle, printData, printFormat);
    //   } catch (error: any) {
    //     setToastMessage("error", error?.message || "Failed to open print");
    //   } finally {
    //     setIsPrinting(false);
    //   }
    //   return;
    // }

    setShowPrinterModal(true);
  };

  const handleShare = async () => {
    if (isLoading) return;

    const documentNumber =
      details?.quotation_no ?? details?.invoice_no ?? "preview";
    const title = isBillLike ? "INVOICE / BILL" : "QUOTATION";

    try {
      await shareReceiptPdf(
        `${documentNumber}.pdf`,
        title,
        printData,
        printFormat,
      );
    } catch (error: any) {
      if (error?.name !== "AbortError") {
        setToastMessage("error", "Failed to share");
      }
    }
  };

  const downloadReceiptInBrowser = async () => {
    const documentNumber =
      details?.quotation_no ?? details?.invoice_no ?? "preview";

    try {
      await downloadReceiptPdf(
        `${documentNumber}.pdf`,
        isBillLike ? "INVOICE" : "QUOTATION",
        printData,
        printFormat,
      );
      setToastMessage("success", "PDF downloaded successfully");
    } catch (error: any) {
      setToastMessage("error", error?.message || "Failed to download PDF");
    }
  };

  const handleSavePdf = async () => {
    if (isSaving) return;
    setIsSaving(true);

    if (!window.electronAPI?.savePDF) {
      await downloadReceiptInBrowser();
      setIsSaving(false);
      return;
    }

    try {
      const documentNumber =
        details?.quotation_no ?? details?.invoice_no ?? "preview";
      const result = await window.electronAPI.savePDF({
        fileName: `${documentNumber}.pdf`,
        title: isBillLike ? "INVOICE / BILL" : "QUOTATION",
        data: printData,
        format: printFormat,
      });

      if (result?.success) {
        setToastMessage("success", "PDF saved successfully");
      } else {
        setToastMessage("error", "Failed to save PDF");
      }
    } catch (error: any) {
      if (error?.status === 401) {
        return;
      }
      setToastMessage("error", error?.message || "Failed to save PDF");
    } finally {
      setIsSaving(false);
    }
  };
  const isMobileDevice = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  return (
    <div className="print-view-overlay">
      <div className="print-view-panel">
        <div className="print-view-header">
          {/* Top row */}
          <div className="print-view-header-top">
            <h3 className="print-view-title">
              {type === "pickup"
                ? "Pickup Order Details"
                : isBillLike
                  ? "Invoice Details"
                  : "Quotation Details"}
            </h3>

            {/* Close button */}
            <div className="print-view-close-wrap">
              <CloseIcon onClose={onClose} />
            </div>
          </div>
          {/* A4 / Thermal format switch */}
          {isElectronDesktop && (
            <div className="print-view-format-toggle">
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
          )}
          j{/* Action buttons */}
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

            {/* {isElectronDesktop ? */}
            {!isMobileDevice && (
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
              </Button>
            )}
            {/* : */}
            {isMobileDevice && (
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
            )}
            {/* } */}

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
        ) : details ? (
          <div
            className={
              printFormat === "thermal"
                ? "print-view-body print-view-body-thermal"
                : "print-view-body"
            }
          >
            {printFormat === "thermal" ? (
              <ThermalPrintPage
                title={isBillLike ? "INVOICE" : "QUOTATION"}
                data={printData}
              />
            ) : (
              <PrintPage
                title={isBillLike ? "INVOICE" : "QUOTATION"}
                data={printData}
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
          title={isBillLike ? "INVOICE / BILL" : "QUOTATION"}
          data={printData}
          format={printFormat}
        />
      )}
    </div>
  );
}
