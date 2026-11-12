import { Loader2, Printer, RefreshCcw, Minus, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { isTauri } from "@tauri-apps/api/core";
import { getPrinters as getTauriPrinters } from "tauri-plugin-printer";

import Button from "../../../components/ui/Button";
import { PrinterInfo, PrintDocType } from "../../../utils/type";
import { setToastMessage } from "../../../helper/helper";
import Dropdown from "../../../components/ui/Dropdown";
import CloseIcon from "../../../components/ui/CloseIcon";
import { printReceiptToTauriPrinter } from "../../../helper/pdf";

export default function PrinterListModal({
  isOpen,
  onClose,
  title = "QUOTATION",
  amount = "",
  data,
  format = "a4",
  docType = "invoice",
}: {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  amount?: string;
  data: any;
  format?: "a4" | "thermal";
  docType?: PrintDocType;
}) {
  const [printers, setPrinters] = useState<PrinterInfo[]>([]);
  const [selectedPrinter, setSelectedPrinter] = useState("");
  const [isPrinting, setIsPrinting] = useState(false);
  const [isLoadingPrinters, setIsLoadingPrinters] = useState(false);
  const [copies, setCopies] = useState(1);

  useEffect(() => {
    if (isOpen) {
      void getPrinters();
    }
  }, [isOpen]);

  const getPrinters = async () => {
    setIsLoadingPrinters(true);

    try {
      let printerList: PrinterInfo[];

      if (isTauri()) {
        if (/android/i.test(navigator.userAgent)) {
          throw new Error("Printer selection is available only on Windows");
        }

        const tauriPrinters = await getTauriPrinters();

        printerList = tauriPrinters.map((printer) => ({
          name: printer.name,
          displayName: printer.name,
          description: printer.driver_name ?? "",
          status: printer.printer_status ?? 0,
        }));
      } else {
        // Existing Electron printer discovery.
        printerList = await window.electronAPI.getPrinters();
      }

      setPrinters(printerList);

      if (printerList.length > 0) {
        setSelectedPrinter(
          printerList.find((printer) => printer.name === selectedPrinter)
            ?.name ?? printerList[0].name,
        );
      } else {
        setSelectedPrinter("");
      }
    } catch (error) {
      console.error("Failed to fetch printers:", error);
      setPrinters([]);
      setSelectedPrinter("");
      setToastMessage(
        "error",
        error instanceof Error ? error.message : "Failed to fetch printers",
      );
    } finally {
      setIsLoadingPrinters(false);
    }
  };

  const handleConfirmPrint = async () => {
    if (!selectedPrinter || isPrinting) return;

    setIsPrinting(true);

    try {
      if (isTauri()) {
        // Tauri Windows printing.
        await printReceiptToTauriPrinter(
          selectedPrinter,
          title,
          data,
          format,
          docType,
          copies,
        );
      } else {
        // Existing Electron printing.
        const result = await window.electronAPI.printToPrinter(
          selectedPrinter,
          {
            title,
            data,
            format,
            docType,
          },
        );

        if (!result?.success) {
          setToastMessage(
            "info",
            result?.error ||
              "Printer is unavailable. Please check the connection.",
          );
          return;
        }
      }

      setToastMessage(
        "success",
        `Print job sent to ${selectedPrinter}. Check the printer queue for completion.`,
      );

      onClose();
    } catch (error) {
      console.error("Print failed:", error);

      setToastMessage(
        "info",
        error instanceof Error
          ? error.message
          : "Printer is unavailable. Please check the connection.",
      );
    } finally {
      setIsPrinting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="printer-modal">
        <div className="printer-modal-header">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="printer-modal-icon">
                <Printer size={18} />
              </div>

              <div className="min-w-0">
                <h3 className="printer-modal-title">Print {title}</h3>

                <p className="text-xs text-txt3">gst • {amount}</p>
              </div>
            </div>

            <CloseIcon onClose={onClose} />
          </div>
        </div>

        <div className="printer-modal-body">
          <div className="printer-modal-section">
            <div className="printer-modal-label-row">
              <label className="text-sm font-medium text-txt1">Printer</label>

              <Button
                variant="secondary"
                className="printer-modal-ghost-btn"
                onClick={getPrinters}
              >
                <RefreshCcw size={12} />
                Refresh
              </Button>
            </div>

            {isLoadingPrinters ? (
              <div className="printer-select-box">
                <Loader2 size={18} className="spin text-primary" />
              </div>
            ) : printers.length === 0 ? (
              <div className="printer-select-box printer-select-box-empty">
                No printer found
              </div>
            ) : (
              <Dropdown
                options={printers.map((printer) => ({
                  label: printer.displayName || printer.name,
                  value: printer.name,
                }))}
                value={selectedPrinter}
                onChange={(e) => setSelectedPrinter(e.target.value)}
              />
            )}
          </div>

          <div className="printer-modal-row">
            <label className="text-sm font-medium text-txt1">Copies</label>

            <div className="flex items-center gap-3">
              <div className="printer-copies-stepper">
                <Button
                  variant="others"
                  onClick={() => setCopies((prev) => Math.max(1, prev - 1))}
                >
                  <Minus size={16} />
                </Button>

                <span className="text-center text-sm font-semibold text-txt1">
                  {copies}
                </span>

                <Button
                  variant="others"
                  onClick={() => setCopies((prev) => prev + 1)}
                >
                  <Plus size={16} />
                </Button>
              </div>

              <Button
                type="button"
                variant="secondary"
                className="printer-modal-ghost-btn text-xs"
                onClick={() =>
                  setToastMessage("info", "System dialog selected")
                }
              >
                System dialog
              </Button>
            </div>
          </div>

          <div className="printer-modal-footer">
            <Button
              variant="outline"
              className="printer-modal-cancel-btn"
              type="button"
              onClick={onClose}
            >
              Cancel
            </Button>

            <Button
              variant="primary"
              className="printer-modal-print-btn"
              type="button"
              disabled={!selectedPrinter || isPrinting || isLoadingPrinters}
              onClick={handleConfirmPrint}
            >
              {isPrinting ? (
                <Loader2 size={14} className="spin" />
              ) : (
                <Printer size={14} />
              )}

              {isPrinting ? "Printing..." : "Print"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
