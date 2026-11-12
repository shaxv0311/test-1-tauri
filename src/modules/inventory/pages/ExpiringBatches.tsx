import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Table from "../../../components/table/Table";
import TableCell from "../../../components/table/TableCell";
import TableHeader from "../../../components/table/TableHeader";
import TableRow from "../../../components/table/TableRow";
import SearchBox from "../component/SearchBox";
import {
  useGetExpiringBatchesQuery,
  useUpdateStockStatusMutation,
} from "../../../api/featutres/inventryFeatures/inventryApi/productApi";
import { setToastMessage } from "../../../helper/helper";
import NoData from "../../../components/table/noData";
import CircleLoader from "../../../components/ui/CircleLoader";
import TablePagination from "../../../components/table/BottomPagination";
import Modal from "../../../components/ui/Modal";
import Button from "../../../components/ui/Button";
import {
  AlertTriangle,
  Clock,
  CalendarClock,
  XCircle,
  Package,
  RotateCcw,
} from "lucide-react";
import { ROUTES } from "../../../router/routes";

interface HeaderItem {
  label: string;
  className?: string;
}

const headerItemsDefault: HeaderItem[] = [
  { label: "No", className: "text-center" },
  { label: "Product", className: "product-col-name" },
  { label: "Batch No" },
  { label: "Expiry Date", className: "text-center" },
  { label: "Days Left", className: "text-center" },
  { label: "Quantity", className: "text-center" },
  { label: "MRP", className: "text-right" },
  { label: "Status", className: "text-center" },
  { label: "Action", className: "text-center" },
];

type ExpiryType = "3_months" | "6_months" | "expired" | "returned";

const toNumber = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatCurrency = (value: unknown) => {
  const amount = toNumber(value);
  return Number.isInteger(amount)
    ? amount.toLocaleString("en-IN")
    : amount.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
};

const getDaysLeft = (expiryDate: string) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);
  const diffTime = expiry.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

const getStatusInfo = (daysLeft: number, expiryType: ExpiryType) => {
  if (expiryType === "expired" || daysLeft < 0) {
    return { label: "Expired", color: "red", icon: XCircle };
  } else if (daysLeft <= 30) {
    return { label: "Critical", color: "red", icon: AlertTriangle };
  } else if (daysLeft <= 90) {
    return { label: "Expiring Soon", color: "orange", icon: Clock };
  } else if (daysLeft <= 180) {
    return { label: "Expiring in 6 Months", color: "yellow", icon: Clock };
  }
  return { label: "Valid", color: "green", icon: Package };
};

const tabOptions: { value: ExpiryType; label: string; icon: any }[] = [
  { value: "3_months", label: "3 Month", icon: Clock },
  { value: "6_months", label: "6 Month", icon: CalendarClock },
  { value: "expired", label: "Expired", icon: XCircle },
  { value: "returned", label: "Return", icon: RotateCcw },
];

export default function ExpiringBatches() {
  const [filter, setFilter] = useState({
    page: 1,
    limit: 10,
    search: "",
  });
  const initialType = (new URLSearchParams(window.location.hash.slice(1))
    .get("type") as ExpiryType) || "3_months";
  const [expiryType, setExpiryType] = useState<ExpiryType>(initialType);

  const navigate = useNavigate();

  const [updateStockStatus, { isLoading: isReturning }] =
    useUpdateStockStatusMutation();

  // Fetch data: "return" tab shows the same expired data but with return actions
  const { data: batches, isLoading, refetch } = useGetExpiringBatchesQuery({
    filter: expiryType,
    page: filter.page,
    limit: filter.limit,
    search: filter.search,
  }, {
    skip: false,
  });

  useEffect(() => {
    setFilter((prev) => ({ ...prev, page: 1 }));
    refetch();
  }, [expiryType, filter.search]);

  const getTitle = () => {
    switch (expiryType) {
      case "3_months":
        return "Expiring in 3 Months";
      case "6_months":
        return "Expiring in 6 Months";
      case "expired":
        return "Expired Batches";
      case "returned":
        return "Return Expired Stock";
      default:
        return "Expiring Batches";
    }
  };

  const handlePageChange = (page: number) => {
    setFilter((prev) => ({ ...prev, page }));
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const handleRowClick = (item: any) => {
    // Navigate to stock detail page to change status: /inventory/stocks/:productId
    navigate(ROUTES.INVENTORY.PRODUCT_STOCKS.replace(":id", String(item?.productId)));
  };

  // Confirmation modal state
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmItem, setConfirmItem] = useState<any>(null);

  const handleConfirm = async () => {
    if (!confirmItem) return;

    try {
      const result = await updateStockStatus(
        {
          productId: confirmItem?.productId,
          stockId: confirmItem?.stockId,
          stock_status: "returned",
        },
      ).unwrap();

      setToastMessage(
        "success",
        result?.message ||
        `Batch ${confirmItem?.batchNo} ${confirmItem?.actionType === "return" ? "returned" : "marked as expired"}`,
      );

      setShowConfirm(false);
      setConfirmItem(null);
      refetch();
    } catch (error: any) {
      if (error?.status === 401) return;
      setToastMessage(
        "error",
        error?.data?.message ||
        `Failed to ${confirmItem?.actionType === "return" ? "return" : "mark as expired"} batch`,
      );
    }
  };

  const handleReturn = (item: any, _e?: React.MouseEvent) => {
    _e?.stopPropagation();
    setConfirmItem({ ...item, actionType: "return" });
    setShowConfirm(true);
  };

  const handleMarkExpired = (item: any, _e?: React.MouseEvent) => {
    _e?.stopPropagation();
    setConfirmItem({ ...item, actionType: "markExpired" });
    setShowConfirm(true);
  };

  return (
    <div className="section-body min-w-0">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-txt1">{getTitle()}</h2>
      </div>

      <SearchBox
        placeholdertxt="Search by product name, batch no..."
        btnText=""
        onClick={() => undefined}
        setFilter={setFilter}
        filter={filter}
        className=""
      />

      <div className="flex flex-wrap items-center gap-2 mb-4">
        {tabOptions.map((tab) => {
          const TabIcon = tab.icon;
          const active = expiryType === tab.value;

          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => setExpiryType(tab.value)}
              aria-pressed={active}
              className={`batch-tab ${active ? "batch-tab-active" : "batch-tab-inactive"}`}
            >
              <TabIcon size={16} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <CircleLoader />
      ) : (
        <>
          <Table minClassName="table-min-md">
            <TableHeader headerItems={headerItemsDefault} />
            <tbody>
              {batches?.batches?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={headerItemsDefault.length} className="">
                    <NoData message="No data available" className="border-none" />
                  </TableCell>
                </TableRow>
              ) : (
                batches?.batches?.map((item: any, index: number) => {
                  const daysLeft = getDaysLeft(item.expiryDate);
                  const statusInfo =
                    expiryType === "returned"
                      ? { label: "Return", color: "blue", icon: RotateCcw }
                      : getStatusInfo(daysLeft, expiryType);
                  const StatusIcon = statusInfo.icon;

                  return (
                    <TableRow key={item?.stockId ?? index}>
                      <TableCell className="text-center">
                        <span>
                          {(batches?.pagination?.page - 1) * filter.limit +
                            index +
                            1}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span
                          className="text-txt1 font-bold"
                          onClick={() => handleRowClick(item)}
                          style={{ cursor: "pointer", display: "block" }}
                        >
                          {item?.productName}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-txt3 font-mono">
                          {item?.batchNo || "-"}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="text-txt1">
                          {formatDate(item.expiryDate)}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span
                          className={`font-bold ${daysLeft < 0
                            ? "text-red"
                            : daysLeft <= 30
                              ? "text-red"
                              : daysLeft <= 90
                                ? "text-orange"
                                : "text-green"
                            }`}
                        >
                          {daysLeft < 0
                            ? `${Math.abs(daysLeft)} days ago`
                            : `${daysLeft} days`}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="text-txt1 font-bold">
                          {item.quantity ?? 0}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-txt1 font-bold">
                          ₹{formatCurrency(item.mrp)}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="inline-flex items-center gap-1">
                          <StatusIcon size={14} className={`text-${statusInfo.color}`} />
                          <span className={`text-${statusInfo.color} font-medium text-xs`}>
                            {statusInfo.label}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {(() => {
                          const isActuallyExpired = daysLeft < 0;
                          const isExpiring3Months = daysLeft >= 0 && daysLeft <= 90;
                          const isExpiring6Months = daysLeft > 90 && daysLeft <= 180;
                          const isNotExpired =
                            !isActuallyExpired && !isExpiring3Months && !isExpiring6Months;

                          return (
                            <div className="flex flex-wrap items-center gap-1.5 justify-center">
                              {/* ---------- NOT EXPIRED area ---------- */}
                              {isNotExpired && (
                                <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 border border-green-200 px-2.5 py-1 rounded-full">
                                  <Package size={12} />
                                  Not Expired
                                </span>
                              )}

                              {/* ---------- 3 MONTH area ---------- */}
                              {/* {isExpiring3Months && (
                                <span className="inline-flex items-center gap-1 text-xs font-medium text-orange-700 bg-orange-50 border border-orange-200 px-2.5 py-1 rounded-full">
                                  <Clock size={12} />
                                  3 Month
                                </span>
                              )} */}
                              {(isExpiring3Months && expiryType != "returned") && (
                                <span className="inline-flex items-center gap-1 text-xs font-medium text-orange-700 bg-orange-50 border border-orange-200 px-2.5 py-1 rounded-full">
                                  <Clock size={12} />
                                  3 Month
                                </span>
                              )}


                              {/* ---------- 6 MONTH area ---------- */}
                              {isExpiring6Months && (
                                <span className="inline-flex items-center gap-1 text-xs font-medium text-yellow-700 bg-yellow-50 border border-yellow-200 px-2.5 py-1 rounded-full">
                                  <Clock size={12} />
                                  6 Month
                                </span>
                              )}

                              {/* ========== ACTION BUTTONS ========== */}

                              {/* Return button — only on Expired tab, for batches that are actually expired */}
                              {expiryType === "expired" &&
                                isActuallyExpired && (
                                  <button
                                    type="button"
                                    className="btn-return-expired"
                                    onClick={(e) => handleReturn(item, e)}
                                    title="Return this expired batch to supplier"
                                    disabled={isReturning || showConfirm}
                                  >
                                    <RotateCcw size={16} />
                                    <span className="btn-return-text">Return</span>
                                  </button>
                                )}

                              {/* Return (mark as expired) — for still-valid batches on 3_months, 6_months.
                                  Marks the batch as expired. */}
                              {!isActuallyExpired &&
                                (expiryType === "3_months" || expiryType === "6_months") && (
                                  <button
                                    type="button"
                                    className="btn-return-expired"
                                    onClick={(e) => handleMarkExpired(item, e)}
                                    title="Return this batch (mark as expired)"
                                    disabled={isReturning || showConfirm}
                                  >
                                    <RotateCcw size={16} />
                                    <span className="btn-return-text">Return</span>
                                  </button>
                                )}
                            </div>
                          );
                        })()}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </tbody>
          </Table>

          {batches?.pagination && batches.pagination.totalPages > 1 && (
            <TablePagination
              total={batches?.pagination.total}
              page={batches?.pagination.page}
              totalPages={batches?.pagination.totalPages}
              onPageChange={handlePageChange}
            />
          )}
        </>
      )}

      {/* Confirmation Modal */}
      <Modal
        open={showConfirm}
        title="Confirm Return"
        message={confirmItem
          ? `Are you sure you want to ${confirmItem.actionType === "return"
            ? "return"
            : "mark as return"} batch ${confirmItem.batchNo} of ${confirmItem.productName}?`
          : ""}
        onClose={() => {
          setShowConfirm(false);
          setConfirmItem(null);
        }}
        buttons={
          <>
            <Button
              onClick={() => {
                setShowConfirm(false);
                setConfirmItem(null);
              }}
              variant="outline"
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              variant="danger"
              loading={isReturning}
              disabled={isReturning}
              onClick={handleConfirm}
            >
              Confirm
            </Button>
          </>
        }
      />
    </div>
  );
}
