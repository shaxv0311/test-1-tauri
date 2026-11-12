import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CirclePlus, Eye, Printer, Search, Undo2, X } from "lucide-react";

import Table from "../../../components/table/Table";
import TableHeader from "../../../components/table/TableHeader";
import TableRow from "../../../components/table/TableRow";
import TableCell from "../../../components/table/TableCell";
import ActionButton from "../../../components/table/ActionButton";
import NoData from "../../../components/table/noData";
import TablePagination from "../../../components/table/BottomPagination";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import StatusCard from "../../../components/ui/StatusCard";
import CircleLoader from "../../../components/ui/CircleLoader";
import { useDebounce } from "../../../helper/helper";
import { formatDateDMY } from "../../../helper/date";
import { ROUTES } from "../../../router/routes";
import {
  useGetSalesReturnByIdQuery,
  useGetSalesReturnsQuery,
} from "../../../api/featutres/salesReturnFeatures/salesReturnApi";
import SalesReturnPrintViewModal from "../component/SalesReturnPrintViewModal";

const headerItems = [
  { label: "No", className: "text-center" },
  { label: "Return No" },
  { label: "Patient" },
  { label: "Doctor" },
  { label: "Return Date" },
  { label: "Action", className: "text-center" },
] as any;

/**
 * The list rows carry no item counts or totals, so the replacement lines are
 * only shown by opening a return.
 */
function SalesReturnDetail({
  id,
  onClose,
}: {
  id: number;
  onClose: () => void;
}) {
  const { data, isLoading } = useGetSalesReturnByIdQuery(id);
  const salesReturn = data?.salesReturn;
  const items = salesReturn?.items ?? [];

  return (
    <div
      className="modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-panel modal-panel-lg">
        <div className="flex items-center justify-between invoice-modal-head">
          <h3 className="invoice-section-heading">
            Sales Return {salesReturn?.invoice_no ?? ""}
          </h3>
          <button
            type="button"
            className="invoice-item-remove"
            onClick={onClose}
          >
            <X size={16} />
          </button>
        </div>

        <div className="invoice-modal-body">
          {isLoading ? (
            <CircleLoader />
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-5">
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-txt3">Return No</span>
                  <span className="text-sm font-bold text-primary">
                    {salesReturn?.invoice_no ?? "-"}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-txt3">Return Date</span>
                  <span className="text-sm font-semibold text-txt1">
                    {salesReturn?.createdAt
                      ? formatDateDMY(salesReturn.createdAt)
                      : "-"}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-txt3">Patient</span>
                  <span className="text-sm font-semibold text-txt1">
                    {salesReturn?.patient_name || "-"}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-txt3">Doctor</span>
                  <span className="text-sm font-semibold text-txt1">
                    {salesReturn?.doctor_name || "-"}
                  </span>
                </div>
              </div>

              {items.length > 0 ? (
                <div className="invoice-item-list mt-0">
                  {items.map((item: any) => (
                    <div key={item.id} className="invoice-item-row">
                      <div className="flex items-center flex-1 gap-3">
                        <div className="flex flex-col gap-1 flex-1">
                          <span className="text-sm font-medium text-truncate">
                            {item.product_name ?? `Product #${item.productId}`}
                          </span>
                          <span className="text-xs font-medium text-txt3">
                            {item.batch_no && (
                              <span className="invoice-item-sn">
                                Batch: {item.batch_no}
                              </span>
                            )}
                            Replaced
                          </span>
                          <span className="text-xs font-medium text-txt3">
                            {item.expiry_date && (
                              <span className="invoice-item-sn">
                                Expiry Date: {item.expiry_date}
                              </span>
                            )}

                          </span>

                        </div>
                      </div>
                      <span className="text-xs font-semibold">
                        {item.quantity} pcs
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <NoData message="No replacement items on this return." />
              )}
            </>
          )}
        </div>

        <div className="modal-footer">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function SalesReturnHistory() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [viewId, setViewId] = useState<number | null>(null);
  const [printId, setPrintId] = useState<number | null>(null);

  const debouncedSearch = useDebounce(search, 600);

  // The list endpoint only accepts page, limit and search, so the whole
  // filter object is passed straight through as the query argument.
  const [filter, setFilter] = useState({
    page: 1,
    limit: 10,
    search: "",
  });

  useEffect(() => {
    setFilter((prev) => ({ ...prev, search: debouncedSearch }));
  }, [debouncedSearch]);

  const { data, isLoading } = useGetSalesReturnsQuery(filter);
  const salesReturns = Array.isArray(data) ? data : data?.salesReturns || [];

  return (
    <div className="section-body gap-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <Undo2 size={20} className="text-primary" />
            <h2 className="sales-return-title">Sales Return History</h2>
          </div>
          <StatusCard
            status={`${data?.pagination?.total ?? 0} Returns`}
            color="blue"
            isShow
          />
        </div>
      </div>

      {/* Filters */}
      <div className="sales-return-filters">
        <Input
          placeholder="Search by return no..."
          icon={<Search size={16} className="text-txt2" />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Button
          variant="primary"
          type="button"
          className="w-full sm-w-auto"
          onClick={() => navigate(ROUTES.RETURNS.SALES_RETURN)}
        >
          <CirclePlus size={20} />
          Add New Sales Return
        </Button>
      </div>

      {/* Table */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {isLoading ? (
          <CircleLoader />
        ) : (
          <Table>
            <TableHeader headerItems={headerItems} />
            <tbody>
              {salesReturns.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="border-none">
                    <NoData
                      message="No sales returns found. Create your first sales return to see it here."
                      className="border-none"
                    />
                  </TableCell>
                </TableRow>
              ) : (
                salesReturns.map((item: any, index: number) => (
                  <TableRow key={item.id || index}>
                    <TableCell className="text-center">
                      <span className="font-semibold text-txt2">
                        {(data?.pagination?.page - 1) * filter.limit + index + 1}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-primary font-bold text-xs">
                        {item.invoice_no}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-txt1 text-xs">
                        {item.patient_name || "-"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-txt1 text-xs">
                        {item.doctor_name || "-"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-txt3 text-xs">
                        {formatDateDMY(item.createdAt)}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <ActionButton
                          icon={Eye}
                          color="primary"
                          onClick={() => setViewId(item.id)}
                        />
                        <ActionButton
                          icon={Printer}
                          color="blue"
                          onClick={() => setPrintId(item.id)}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </tbody>
          </Table>
        )}
      </div>

      {data?.pagination?.totalPages > 1 && (
        <TablePagination
          total={data.pagination.total}
          page={data.pagination.page}
          totalPages={data.pagination.totalPages}
          onPageChange={(page) => setFilter({ ...filter, page })}
        />
      )}

      {viewId && (
        <SalesReturnDetail id={viewId} onClose={() => setViewId(null)} />
      )}

      {printId && (
        <SalesReturnPrintViewModal
          isOpen={true}
          id={printId}
          onClose={() => setPrintId(null)}
        />
      )}
    </div>
  );
}
