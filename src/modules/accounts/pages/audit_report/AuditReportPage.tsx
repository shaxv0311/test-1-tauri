import { useEffect, useState } from "react";
import { FileDown, FileSpreadsheet, FileText, Eye, Printer, Search } from "lucide-react";
import Table from "../../../../components/table/Table";
import TableHeader from "../../../../components/table/TableHeader";
import TableRow from "../../../../components/table/TableRow";
import TableCell from "../../../../components/table/TableCell";
import NoData from "../../../../components/table/noData";
import Button from "../../../../components/ui/Button";
import Input from "../../../../components/ui/Input";
import StatusCard from "../../../../components/ui/StatusCard";
import MonthDropdown from "../../../../components/ui/MonthDropdown";
import { useDebounce, setToastMessage } from "../../../../helper/helper";
import { CURRENT_MONTH, CURRENT_YEAR, MONTHS } from "../../../../utils/constants";
import { useGetPrescriptionRegisterQuery } from "../../../../api/featutres/invoiceFeatures/invoiceApi";
import { useGetShopQuery } from "../../../../api/featutres/shopFeatures/shopApi";
import CircleLoader from "../../../../components/ui/CircleLoader";
import YearDropdown from "../../../../components/ui/YearDropdown";
import ActionButton from "../../../../components/table/ActionButton";
import Modal from "../../../../components/ui/Modal";
import {
  exportPrescriptionRegisterPdf,
  exportPrescriptionRegisterXlsx,
  printPrescriptionRegister,
} from "../../../../helper/prescriptionReport";

const headerItems = [
  { label: "No", className: "text-center" },
  { label: "Bill Date" },
  { label: "Bill No" },
  { label: "Doctor Name" },
  { label: "Patient Name" },
  { label: "Drug Prescribed" },
  { label: "Qty" },
  { label: "Action", className: "text-center" },
] as any;

const CURRENT_MONTH_INDEX = MONTHS.indexOf(CURRENT_MONTH) + 1;

export default function AuditReportPage() {
  const [search, setSearch] = useState("");
  const [viewId, setViewId] = useState<number | null>(null);

  const debouncedSearch = useDebounce(search, 600);

  const [filter, setFilter] = useState({
    search: "",
    year: String(CURRENT_YEAR),
    month: CURRENT_MONTH_INDEX as number | undefined,
  });

  useEffect(() => {
    setFilter((prev) => ({ ...prev, search: debouncedSearch }));
  }, [debouncedSearch]);

  const { data, isLoading } = useGetPrescriptionRegisterQuery(filter);
  const rows = data?.rows || [];
  const { data: shopData } = useGetShopQuery({});

  const [exporting, setExporting] = useState<"xl" | "pdf" | "print" | null>(null);

  const reportMeta = {
    year: filter.year,
    monthLabel: filter.month ? MONTHS[filter.month - 1] : undefined,
    search: filter.search || undefined,
    companyName: shopData?.shop?.shop_name || undefined,
    companyAddress: shopData?.shop?.address || undefined,
  };

  const runExport = async (
    kind: "xl" | "pdf" | "print",
    action: () => Promise<void> | void,
    successMessage: string,
  ) => {
    if (exporting) return;
    setExporting(kind);
    try {
      await action();
      setToastMessage("success", successMessage);
    } catch (error) {
      console.error("Prescription register export failed:", error);
      setToastMessage("error", "Failed to export prescription register");
    } finally {
      setExporting(null);
    }
  };

  const handlePrint = () =>
    runExport("print", () => printPrescriptionRegister(rows, reportMeta), "Opening print view...");

  const handleExportXl = () =>
    runExport("xl", () => exportPrescriptionRegisterXlsx(rows, reportMeta), "Excel file is being prepared...");

  const handleExportPdf = () =>
    runExport("pdf", () => exportPrescriptionRegisterPdf(rows, reportMeta), "PDF file is being prepared...");

  return (
    <div className="section-body gap-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <FileText size={20} className="text-primary" />
            <h2 className="invoice-history-title">Audit Report</h2>
          </div>
          <StatusCard
            status={`${data?.totalRows || 0} Entries`}
            color="blue"
            isShow
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            type="button"
            onClick={handlePrint}
            disabled={!!exporting}
            loading={exporting === "print"}
            title="Print the register in table format"
          >
            <Printer size={16} />
            Print
          </Button>
          <Button
            variant="success"
            type="button"
            onClick={handleExportXl}
            disabled={!!exporting}
            loading={exporting === "xl"}
            title="Download the register as an Excel file"
          >
            <FileSpreadsheet size={16} />
            Excel
          </Button>
          <Button
            variant="danger"
            type="button"
            onClick={handleExportPdf}
            disabled={!!exporting}
            loading={exporting === "pdf"}
            title="Download the register as a PDF"
          >
            <FileDown size={16} />
            PDF
          </Button>
        </div>
      </div>

      <div className="invoice-history-filters">
        <YearDropdown
          value={filter.year}
          onChange={(e) =>
            setFilter((prev) => ({ ...prev, year: e.target.value }))
          }
        />
        <MonthDropdown
          value={filter.month}
          onChange={(month) => setFilter((prev) => ({ ...prev, month }))}
        />
        <div className="flex gap-2">
          <Input
            placeholder="Search bill no, patient, doctor, drug..."
            icon={<Search size={16} className="text-txt2" />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && setFilter((prev) => ({ ...prev, search: debouncedSearch }))}
          />
          <Button
            variant="primary"
            type="button"
            onClick={() => setFilter((prev) => ({ ...prev, search: debouncedSearch }))}
          >
            Search
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {isLoading ? (
          <CircleLoader />
        ) : (
          <Table>
            <TableHeader headerItems={headerItems} />
            <tbody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={headerItems.length} className="border-none">
                    <NoData
                      message="No prescription register data found."
                      className="border-none"
                    />
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((item: any, index: number) => {
                  return (
                    <TableRow key={`${item.invoiceNo}-${index}`}>
                      <TableCell className="text-center">
                        <span className="font-semibold text-txt2">
                          {index + 1}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-txt3 text-xs">
                          {item.invoiceDate}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-primary font-bold text-xs">
                          {item.invoiceNo}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-txt1 font-bold">
                          {item.doctorName}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-txt1 font-bold">
                          {item.patientName}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-txt1">
                          {item.drugsPrescribed}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-txt1 font-bold">
                          {item.qty}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <ActionButton
                          icon={Eye}
                          color="primary"
                          onClick={() => {
                            setViewId(index);
                          }}
                          text="View"
                        />
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </tbody>
          </Table>
        )}
      </div>
      {viewId !== null && rows[viewId] && (
        <Modal
          open={true}
          title="Prescription Details"
          message={
            <div className="text-left space-y-1">
              <p><strong>Bill Date:</strong> {rows[viewId].invoiceDate}</p>
              <p><strong>Bill No:</strong> {rows[viewId].invoiceNo}</p>
              <p><strong>Doctor Name:</strong> {rows[viewId].doctorName}</p>
              <p><strong>Patient Name:</strong> {rows[viewId].patientName}</p>
              <p><strong>Drug Prescribed:</strong> {rows[viewId].drugsPrescribed}</p>
              <p><strong>Qty:</strong> {rows[viewId].qty}</p>
              <p><strong>Batch No:</strong> {rows[viewId].batchNo}</p>
              <p><strong>Date Of Expiry:</strong> {rows[viewId].expiryDate}</p>
            </div>
          }
          onClose={() => setViewId(null)}
          buttons={
            <Button
              onClick={() => setViewId(null)}
              variant="primary"
              className="flex-1"
            >
              Close
            </Button>
          }
        />
      )}
    </div>
  );
}
