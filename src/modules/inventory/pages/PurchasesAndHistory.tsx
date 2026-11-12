import { Eye, Plus, SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import ActionButton from "../../../components/table/ActionButton";
import Table from "../../../components/table/Table";
import TableCell from "../../../components/table/TableCell";
import TableHeader from "../../../components/table/TableHeader";
import TableRow from "../../../components/table/TableRow";
import StatusCard from "../../../components/ui/StatusCard";
import Button from "../../../components/ui/Button";
import SearchBox from "../component/SearchBox";
import AddPurchase from "../component/AddPurchase";
import { useGetPurchasesQuery } from "../../../api/featutres/inventryFeatures/inventryApi/purchaseApi";
import NoData from "../../../components/table/noData";
import { formatDateDMY } from "../../../helper/date";
import PaymentUpdateModal from "../component/PaymentUpdateModal";
import CircleLoader from "../../../components/ui/CircleLoader";
import TablePagination from "../../../components/table/BottomPagination";
import PurchaseViewModel from "../component/PurchaseViewModel";
import ProductPurchaseHistoryModal from "../component/ProductPurchaseHistoryModal";

interface PurchaseListItem {
  id: number;
  invoiceDate: string;
  invoiceNo: string;
  supplier_name?: string | null;
  payment_status: "Paid" | "Unpaid" | "Partial";
  total_amount: number | string;
  paid_amount: number | string;
  remaining_due: number | string;
}

const headerItemsDefault = [
  { label: "No", className: "text-center" },
  { label: "Purchase Date" },
  { label: "Purchase Number" },
  { label: "Supplier Name" },
  { label: "Payment Status", className: "text-center" },
  { label: "Total", className: "text-right" },
  { label: "Paid", className: "text-right" },
  { label: "Due", className: "text-right" },
  { label: "Action", className: "text-center" },
] as any;

const toNumber = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatCurrency = (value: unknown) =>
  `₹${toNumber(value).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export default function PurchasesAndHistory() {
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState({
    page: 1,
    limit: 10,
    search: "",
  });
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [selectedPurchase, setSelectedPurchase] =
    useState<PurchaseListItem | null>(null);
  const [selected, setSelected] = useState<PurchaseListItem | null>(null);
  const { data, isLoading } = useGetPurchasesQuery(filter);
  const purchases = data?.purchases ?? [];
  const billedAmount = purchases.reduce(
    (total: number, item: PurchaseListItem) =>
      total + toNumber(item.total_amount),
    0,
  );
  const paidAmount = purchases.reduce(
    (total: number, item: PurchaseListItem) =>
      total + toNumber(item.paid_amount),
    0,
  );
  const dueAmount = purchases.reduce(
    (total: number, item: PurchaseListItem) =>
      total + toNumber(item.remaining_due),
    0,
  );

  const handleEditPayment = (purchase: PurchaseListItem) => {
    setSelectedPurchase(purchase);
    setIsPaymentModalOpen(true);
  };

  return (
    <div className="section-body">
      <div className="purchase-toolbar">
        <SearchBox
          placeholdertxt="Search purchases by invoice or supplier..."
          btnText="Add Purchase"
          setFilter={setFilter}
          filter={filter}
          onClick={() => setIsOpen(true)}
          className="purchase-toolbar-search"
        />
        <Button
          type="button"
          variant="outline"
          className="purchase-filter-icon-btn"
          title="Product purchase history"
          aria-label="Product purchase history"
          onClick={() => setIsHistoryOpen(true)}
        >
          <SlidersHorizontal size={18} />
        </Button>
      </div>

      {/* {!isLoading && (
        <div className="purchase-list-summary" aria-label="Purchase summary">
          <div className="purchase-list-summary-card">
            <div>
              <p className="purchase-list-summary-label">Purchases</p>
              <p className="purchase-list-summary-value">{purchases.length}</p>
              <p className="purchase-list-summary-label">Current page</p>
            </div>
          </div>
          <div className="purchase-list-summary-card">
            <div>
              <p className="purchase-list-summary-label">Billed</p>
              <p className="purchase-list-summary-value">
                {formatCurrency(billedAmount)}
              </p>
              <p className="purchase-list-summary-label">Current page</p>
            </div>
          </div>
          <div className="purchase-list-summary-card purchase-list-summary-card-green">
            <div>
              <p className="purchase-list-summary-label">Paid</p>
              <p className="purchase-list-summary-value">
                {formatCurrency(paidAmount)}
              </p>
              <p className="purchase-list-summary-label">Current page</p>
            </div>
          </div>
          <div className="purchase-list-summary-card purchase-list-summary-card-red">
            <div>
              <p className="purchase-list-summary-label">Due</p>
              <p className="purchase-list-summary-value">
                {formatCurrency(dueAmount)}
              </p>
              <p className="purchase-list-summary-label">Current page</p>
            </div>
          </div>
        </div>
      )} */}

      {isLoading ? (
        <CircleLoader />
      ) : (
        <div className="purchase-list-table">
          <Table>
            <TableHeader headerItems={headerItemsDefault} />
            <tbody>
              {purchases.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={headerItemsDefault.length} className="">
                    <NoData message="No data available" className="border-none" />
                  </TableCell>
                </TableRow>
              ) : (
                purchases.map((item: PurchaseListItem, index: number) => (
                  <TableRow key={item.id}>
                    <TableCell className="text-center">
                      {(data?.pagination?.page - 1) * filter.limit + index + 1}
                    </TableCell>
                    <TableCell>
                      <span className="text-txt3">
                        {formatDateDMY(item.invoiceDate)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-txt1 font-bold">{item.invoiceNo}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-txt1 font-bold">
                        {item.supplier_name || "—"}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <StatusCard
                        status={item.payment_status}
                        color={
                          item.payment_status === "Paid"
                            ? "green"
                            : item.payment_status === "Unpaid"
                              ? "red"
                              : "orange"
                        }
                        isShow
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="text-txt1 font-bold">
                        {formatCurrency(item.total_amount)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="text-txt1 font-bold">
                        {formatCurrency(item.paid_amount)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="text-txt1 font-bold">
                        {formatCurrency(item.remaining_due)}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="purchase-row-actions">
                        <ActionButton
                          icon={Eye}
                          onClick={() => setSelected(item)}
                          color="primary"
                          text="View"
                        />
                        {toNumber(item.remaining_due) > 0 && (
                          <ActionButton
                            icon={Plus}
                            onClick={() => handleEditPayment(item)}
                            color="green"
                            text="Add Payment"
                          />
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </tbody>
          </Table>
        </div>
      )}

      {data?.pagination?.totalPages > 1 && (
        <TablePagination
          total={data.pagination.total}
          page={data.pagination.page}
          totalPages={data.pagination.totalPages}
          onPageChange={(page) => setFilter({ ...filter, page })}
        />
      )}

      <AddPurchase isOpen={isOpen} onClose={() => setIsOpen(false)} />

      {selected && (
        <PurchaseViewModel
          data={selected}
          onClose={() => setSelected(null)}
        />
      )}

      {selectedPurchase && (
        <PaymentUpdateModal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          data={selectedPurchase}
        />
      )}

      <ProductPurchaseHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
      />
    </div>
  );
}
