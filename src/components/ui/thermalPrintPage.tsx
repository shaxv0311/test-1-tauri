import { AnyPrintData, PrintDocType } from "../../utils/type";
import { getPrintCss, getPrintTemplate } from "../templates/printTemplate";

interface ThermalPrintPageProps {
  title?: string;
  data: AnyPrintData;
  /** Defaults to the priced invoice layout; sales returns pass "salesReturn". */
  docType?: PrintDocType;
}

export const ThermalPrintPage = ({
  title = "INVOICE / BILL",
  data,
  docType = "invoice",
}: ThermalPrintPageProps) => {
  return (
    <div className="receipt-print-root receipt-print-root-thermal">
      {/* Scoped to .receipt-print-root — must not reach the app's own styles. */}
      <style dangerouslySetInnerHTML={{ __html: getPrintCss(true) }} />
      <div
        dangerouslySetInnerHTML={{
          __html: getPrintTemplate(docType, true)(title, data as any),
        }}
      />
    </div>
  );
};