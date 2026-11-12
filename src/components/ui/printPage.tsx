import { AnyPrintData, PrintDocType } from "../../utils/type";
import { getPrintCss, getPrintTemplate } from "../templates/printTemplate";

interface PrintPageProps {
  title?: string;
  data: AnyPrintData;
  /** Defaults to the priced invoice layout; sales returns pass "salesReturn". */
  docType?: PrintDocType;
}

export const PrintPage = ({
  title = "INVOICE / BILL",
  data,
  docType = "invoice",
}: PrintPageProps) => {
  return (
    <div className="receipt-print-root">
      {/* Scoped to .receipt-print-root — must not reach the app's own styles. */}
      <style dangerouslySetInnerHTML={{ __html: getPrintCss(false) }} />
      <div
        dangerouslySetInnerHTML={{
          __html: getPrintTemplate(docType, false)(title, data as any),
        }}
      />
    </div>
  );
};