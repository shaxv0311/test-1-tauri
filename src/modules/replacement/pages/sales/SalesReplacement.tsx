import { useEffect, useMemo, useState } from "react";
import {
  BadgeIndianRupee,
  CalendarDays,
  Eye,
  Info,
  Package,
  Search,
  ShoppingCart,
  Trash2,
  Undo2,
} from "lucide-react";

import Table from "../../../../components/table/Table";
import TableHeader from "../../../../components/table/TableHeader";
import TableRow from "../../../../components/table/TableRow";
import TableCell from "../../../../components/table/TableCell";
import ActionButton from "../../../../components/table/ActionButton";
import TablePagination from "../../../../components/table/BottomPagination";
import Button from "../../../../components/ui/Button";
import Input from "../../../../components/ui/Input";
import Modal from "../../../../components/ui/Modal";
import StatusCard from "../../../../components/ui/StatusCard";
import CircleLoader from "../../../../components/ui/CircleLoader";
import { useDebounce, setToastMessage } from "../../../../helper/helper";
import { formatDateDMY } from "../../../../helper/date";
import { useCalculateAction } from "../../../../hooks/useCalculateAction";
import {
  useDeleteSalesReplaceMutation,
  useGetSalesReplacesQuery,
} from "../../../../api/featutres/salesReplaceFeatures/salesReplaceApi";
import SalesReplaceFormModal from "../../component/SalesReplaceFormModal";
import SalesReplaceDetailModal from "../../component/SalesReplaceDetailModal";

const headerItems = [
  { label: "No", className: "text-center" },
  { label: "Product" },
  { label: "Batch No" },
  { label: "Expiry" },
  { label: "Qty Added", className: "text-center" },
  { label: "Total Price", className: "text-right" },
  { label: "Date" },
  { label: "Action", className: "text-center" },
] as any;

export default function SalesReplacement() {
  const calc = useCalculateAction();

  const [search, setSearch] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [viewId, setViewId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [confrim, setConfrim] = useState(false);

  const debouncedSearch = useDebounce(search, 600);

  // The list endpoint only accepts page, limit and search, so the whole filter
  // object is passed straight through as the query argument.
  const [filter, setFilter] = useState({
    page: 1,
    limit: 10,
    search: "",
  });

  useEffect(() => {
    setFilter((prev) => ({ ...prev, page: 1, search: debouncedSearch }));
  }, [debouncedSearch]);

  const { data, isLoading } = useGetSalesReplacesQuery(filter);
  const rows = data?.salesReplaces ?? [];
  const [deleteSalesReplace, { isLoading: isDeleteLoading }] =
    useDeleteSalesReplaceMutation();

  /**
   * Totals for the current page only — the API returns no aggregate, and
   * summing across pages would need every page fetched.
   */
  const pageTotals = useMemo(
    () =>
      rows.reduce(
        (acc, row) => ({
          pieces: acc.pieces + calc.toNumber(row.quantity),
          amount: acc.amount + calc.toNumber(row.price),
        }),
        { pieces: 0, amount: 0 },
      ),
    [rows, calc],
  );

  const handleConfirmDelete = async () => {
    if (!deleteId) return;

    try {
      const res: any = await deleteSalesReplace(deleteId).unwrap();

      if (res?.success) {
        setToastMessage(
          "success",
          res?.message || "Replacement deleted, stock restored",
        );
      }
    } catch (error: any) {
      // A 401 is already handled globally (toast + redirect to login).
      if (error?.status === 401) return;
      setToastMessage(
        "error",
        error?.data?.message || "Failed to delete replacement",
      );
    } finally {
      setDeleteId(null);
      setConfrim(false);
    }
  };

  return (
    <div className="section-body gap-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <Undo2 size={20} className="text-primary" />
            <h2 className="sales-title">Sales Replacement</h2>
          </div>
          <StatusCard
            status={`${data?.pagination?.total ?? 0} Replacements`}
            color="blue"
            isShow
          />
        </div>
      </div>

      <div className="sales-note">
        <Info size={16} className="sales-note-icon" />
        <span>
          A replacement returns stock to a batch and books the price as an
          expense. Deleting an entry restores the batch and removes its expense.
        </span>
      </div>

      {/* Summary cards for the current page */}
      <div className="sales-summary-grid">
        <div className="sales-summary-card">
          <span className="sales-summary-icon">
            <Package size={18} />
          </span>
          <div className="flex flex-col gap-1">
            <span className="text-xs text-txt3">Pieces Added (this page)</span>
            <span className="text-sm font-bold text-txt1">
              {pageTotals.pieces}
            </span>
          </div>
        </div>

        <div className="sales-summary-card">
          <span className="sales-summary-icon sales-summary-icon-green">
            <BadgeIndianRupee size={18} />
          </span>
          <div className="flex flex-col gap-1">
            <span className="text-xs text-txt3">Expense (this page)</span>
            <span className="text-sm font-bold text-txt1">
              ₹{pageTotals.amount.toLocaleString("en-IN")}
            </span>
          </div>
        </div>

        <div className="sales-summary-card">
          <span className="sales-summary-icon sales-summary-icon-orange">
            <ShoppingCart size={18} />
          </span>
          <div className="flex flex-col gap-1">
            <span className="text-xs text-txt3">Total Records</span>
            <span className="text-sm font-bold text-txt1">
              {data?.pagination?.total ?? 0}
            </span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="sales-replace-filters">
        <Input
          placeholder="Search by product or batch no..."
          icon={<Search size={16} className="text-txt2" />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Button
          variant="primary"
          type="button"
          className="w-full sm-w-auto"
          onClick={() => setIsFormOpen(true)}
        >
          <Package size={18} />
          Add Replacement
        </Button>
      </div>

      {/* Table */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {isLoading ? (
          <CircleLoader />
        ) : rows.length === 0 ? (
          <div className="sales-empty">
            <span className="sales-empty-icon flex items-center justify-center">
              <Package size={22} />
            </span>
            <div className="sales-empty-text">
              <p className="sales-empty-title">No replacements yet</p>
              <p className="sales-empty-desc">
                When a customer swaps an item, record it here to put the stock
                back and book the expense.
              </p>
            </div>
            <Button
              variant="primary"
              type="button"
              onClick={() => setIsFormOpen(true)}
            >
              <Package size={18} />
              Add Replacement
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader headerItems={headerItems} />
            <tbody>
              {rows.map((row, index) => (
                <TableRow key={row.id}>
                  <TableCell className="text-center">
                    <span className="font-semibold text-txt2">
                      {((data?.pagination?.page ?? 1) - 1) * filter.limit +
                        index +
                        1}
                      {/* {(data?.pagination?.page - 1) * filter.limit + index + 1} */}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-txt1 font-bold text-xs">
                      {row.product_name}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-primary font-bold text-xs">
                      {row.batch_no || "Default"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-txt3 text-xs">
                      {row.expiry_date || "-"}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="text-txt1 font-semibold">
                      {row.quantity}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="text-txt1 font-bold">
                      ₹{row.price.toLocaleString("en-IN")}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-txt3 text-xs flex items-center gap-1">
                      <CalendarDays size={12} />
                      {formatDateDMY(row.createdAt)}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <ActionButton
                        icon={Eye}
                        color="primary"
                        onClick={() => setViewId(row.id)}
                      />
                      {/* <ActionButton
                        icon={Trash2}
                        color="red"
                        onClick={() => {
                          setConfrim(true);
                          setDeleteId(row.id);
                        }}
                      /> */}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </tbody>
          </Table>
        )}
      </div>

      {(data?.pagination?.totalPages ?? 0) > 1 && (
        <TablePagination
          total={data?.pagination?.total ?? 0}
          page={data?.pagination?.page ?? 1}
          totalPages={data?.pagination?.totalPages ?? 1}
          onPageChange={(page) => setFilter((prev) => ({ ...prev, page }))}
        />
      )}

      <SalesReplaceFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSaved={() => setIsFormOpen(false)}
      />

      {viewId && (
        <SalesReplaceDetailModal id={viewId} onClose={() => setViewId(null)} />
      )}

      <Modal
        open={confrim}
        title="Delete Confirmation"
        message="Are you sure you want to delete this replacement? The stock will be deducted from the batch again and the expense entry removed."
        onClose={() => setConfrim(false)}
        buttons={
          <>
            <Button
              onClick={() => setConfrim(false)}
              variant="outline"
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              variant="danger"
              loading={isDeleteLoading}
              disabled={isDeleteLoading}
              onClick={handleConfirmDelete}
            >
              Confirm
            </Button>
          </>
        }
      />
    </div>
  );
}
