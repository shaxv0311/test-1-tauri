import { useEffect, useMemo, useState } from "react";
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
import { useGetSuppliersQuery } from "../../../api/featutres/inventryFeatures/inventryApi/brandCategorySupplierApi";
import {
  useGetPurchaseReturnByIdQuery,
  useGetPurchaseReturnsQuery,
} from "../../../api/featutres/purchaseReturnFeatures/purchaseReturnApi";
import PurchaseReturnPrintViewModal from "../component/PurchaseReturnPrintViewModal";

const headerItems = [
  { label: "No", className: "text-center" },
  { label: "Return No" },
  { label: "Supplier" },
  { label: "Return Date" },
  { label: "Action", className: "text-center" },
] as any;

/**
 * The id is held together with the resolved supplier name because the detail
 * response carries only `supplierId`, and the names map is built from a
 * separate paginated request — so the name has to be captured at click time.
 */
interface ReturnTarget {
  id: number;
  supplierName: string | null;
}

/**
 * The list rows carry no item counts and no supplier name, so the replacement
 * lines are only shown by opening a return, and the supplier is resolved from
 * a single suppliers lookup rather than per row.
 */
function PurchaseReturnDetail({
  id,
  supplierName,
  onClose,
}: {
  id: number;
  supplierName?: string | null;
  onClose: () => void;
}) {
  const { data, isLoading } = useGetPurchaseReturnByIdQuery(id);
  const purchaseReturn = data?.purchaseReturn;
  const replacements = purchaseReturn?.replacements ?? [];

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
            Purchase Return {purchaseReturn?.invoiceNo ?? ""}
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
                    {purchaseReturn?.invoiceNo ?? "-"}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-txt3">Supplier</span>
                  <span className="text-sm font-semibold text-txt1">
                    {supplierName ?? "-"}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-txt3">Return Date</span>
                  <span className="text-sm font-semibold text-txt1">
                    {purchaseReturn?.createdAt
                      ? formatDateDMY(purchaseReturn.createdAt)
                      : "-"}
                  </span>
                </div>
              </div>

              {replacements.length > 0 ? (
                <div className="invoice-item-list mt-0">
                  {replacements.map((item: any) => (
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
                            Received
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

export default function PurchaseReturnHistory() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [viewTarget, setViewTarget] = useState<ReturnTarget | null>(null);
  const [printTarget, setPrintTarget] = useState<ReturnTarget | null>(null);

  const debouncedSearch = useDebounce(search, 600);

  // The list endpoint only accepts page, limit and search, so the whole filter
  // object is passed straight through as the query argument.
  const [filter, setFilter] = useState({
    page: 1,
    limit: 10,
    search: "",
  });

  useEffect(() => {
    setFilter((prev) => ({ ...prev, search: debouncedSearch }));
  }, [debouncedSearch]);

  const { data, isLoading } = useGetPurchaseReturnsQuery(filter);
  const purchaseReturns = Array.isArray(data)
    ? data
    : data?.purchaseReturns || [];

  /**
   * The list rows carry only `supplierId`, so the names are resolved from one
   * shared suppliers request. Suppliers beyond the first page fall back to the
   * id rather than silently showing the wrong name.
   */
  const { data: supplierList } = useGetSuppliersQuery({
    page: 1,
    limit: 100,
    search: "",
  });

  const supplierNames = useMemo(() => {
    const map = new Map<number, string>();
    (supplierList?.suppliers ?? []).forEach((item: any) => {
      map.set(Number(item.id), item.supplier_name);
    });
    return map;
  }, [supplierList]);

  /** Resolves a list row into the id + name the modals need. */
  const toTarget = (row: any): ReturnTarget => ({
    id: row.id,
    supplierName: row.supplierId
      ? supplierNames.get(Number(row.supplierId)) ?? null
      : null,
  });

  return (
    <div className="section-body gap-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <Undo2 size={20} className="text-primary" />
            <h2 className="sales-return-title">Purchase Return History</h2>
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
          onClick={() => navigate(ROUTES.RETURNS.PURCHASE_RETURN)}
        >
          <CirclePlus size={20} />
          Add New Purchase Return
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
              {purchaseReturns.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="border-none">
                    <NoData
                      message="No purchase returns found. Create your first purchase return to see it here."
                      className="border-none"
                    />
                  </TableCell>
                </TableRow>
              ) : (
                purchaseReturns.map((item: any, index: number) => (
                  <TableRow key={item.id || index}>
                    <TableCell className="text-center">
                      <span className="font-semibold text-txt2">
                        {(data?.pagination?.page - 1) * filter.limit + index + 1}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-primary font-bold text-xs">
                        {item.invoiceNo}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-txt1 text-xs">
                        {item.supplierId
                          ? supplierNames.get(Number(item.supplierId)) ??
                            `Supplier #${item.supplierId}`
                          : "-"}
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
                          onClick={() => setViewTarget(toTarget(item))}
                        />
                        <ActionButton
                          icon={Printer}
                          color="blue"
                          onClick={() => setPrintTarget(toTarget(item))}
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

      {viewTarget && (
        <PurchaseReturnDetail
          id={viewTarget.id}
          supplierName={viewTarget.supplierName}
          onClose={() => setViewTarget(null)}
        />
      )}

      {printTarget && (
        <PurchaseReturnPrintViewModal
          isOpen={true}
          id={printTarget.id}
          supplierName={printTarget.supplierName}
          onClose={() => setPrintTarget(null)}
        />
      )}
    </div>
  );
}