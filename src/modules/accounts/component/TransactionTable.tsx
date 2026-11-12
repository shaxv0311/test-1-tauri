import { TrendingDown, TrendingUp } from "lucide-react";
import CustomDot from "../../../components/ui/CustomDot";
import Table from "../../../components/table/Table";
import TableHeader from "../../../components/table/TableHeader";
import TableRow from "../../../components/table/TableRow";
import TableCell from "../../../components/table/TableCell";
// import { MdDeleteOutline } from "react-icons/md";
import IconBox from "../../../components/ui/IconBox";
import { formatDateDMY } from "../../../helper/date";
import {
  IncomeExpenseEntry,
  useDeleteIncomeExpenseMutation,
} from "../../../api/featutres/incomeExpenseFeatures/incomeExpenseApi";
import { setToastMessage } from "../../../helper/helper";
import Modal from "../../../components/ui/Modal";
import Button from "../../../components/ui/Button";
import { useState } from "react";
import NoData from "../../../components/table/noData";
import TablePagination from "../../../components/table/BottomPagination";

const headerItemsDefault = [
  {
    label: "No",
    className: "text-center",
    rounded: false,
  },
  {
    label: "Date",
  },
  {
    label: "Reason/Description",
  },
  {
    label: "Amount(₹)",
  },
  {
    label: "Action",
    className: "text-center",
    rounded: false,
  },
];

export const TransactionTable = ({
  title,
  data,
  type,
  pagination,
  onPageChange,
}: {
  title: string;
  data: IncomeExpenseEntry[];
  type: "income" | "expense";
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  onPageChange?: (page: number) => void;
}) => {
  const isIncome = type === "income";
  const toneClass = isIncome
    ? "transaction-table-icon-green"
    : "transaction-table-icon-red";
  const amountClass = isIncome ? "text-green" : "text-red";
  const [confrim, setConfrim] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleteIncomeExpense, { isLoading }] = useDeleteIncomeExpenseMutation();

  const onDelete = async () => {
    if (deleteId === null) return;

    try {
      const res = await deleteIncomeExpense(deleteId).unwrap();
      if (res?.success) {
        setToastMessage("success", res.message || "Deleted successfully");
        setConfrim(false);
        setDeleteId(null);
      }
    } catch (e: any) {
      if (e?.status === 401) {
        return;
      }
      setToastMessage("error", e?.data?.message || "Something went wrong");
    }
  };

  return (
    <div className="transaction-table">
      <div className="transaction-table-header">
        <div className="transaction-table-header-left">
          <IconBox
            icon={isIncome ? <TrendingUp /> : <TrendingDown />}
            className={toneClass}
          />

          <div>
            <h3 className="transaction-table-title">
              {isIncome ? "Income Table" : "Expense Table"}
            </h3>

            <p className="transaction-table-subtitle">
              Revenues & Sales Income
            </p>
          </div>
        </div>

        <span className="transaction-table-count">
          {data.length} Entries
          <CustomDot color="primary" />₹
          {data
            .reduce((sum, item) => sum + item.amount, 0)
            .toLocaleString("en-IN")}
        </span>
      </div>

      <Table>
        <TableHeader headerItems={headerItemsDefault} />

        <tbody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="border-none">
                <NoData message="No data available" className="border-none" />
              </TableCell>
            </TableRow>
          ) : (
            data.map((item, index) => (
              <TableRow key={`${item.source}-${item.id}`}>
                <TableCell className="text-center">
                  <span>
                    {(pagination
                      ? (pagination.page - 1) * pagination.limit
                      : 0) +
                      index +
                      1}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-txt3">{formatDateDMY(item?.date)}</span>
                </TableCell>
                <TableCell>
                  <span className="text-txt1 font-bold">
                    {item.description}
                    {item.bill_no ? ` (${item.bill_no})` : ""}
                  </span>
                </TableCell>
                <TableCell>
                  <span className={`font-medium ${amountClass}`}>
                    {isIncome ? "+" : "-"}₹{item.amount.toLocaleString("en-IN")}
                  </span>
                </TableCell>
                <TableCell className="text-center">
                  {item.source === "manual" ? (
                    <button
                      type="button"
                      onClick={() => {
                        setDeleteId(Number(item.id));
                        setConfrim(true);
                      }}
                      disabled={isLoading}
                      className="transaction-table-delete disabled-opacity-60"
                    >
                      {/* <MdDeleteOutline size={20} /> */}
                    </button>
                  ) : (
                    <span className="text-txt3">-</span>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </tbody>
      </Table>

      {pagination && pagination.totalPages > 1 && onPageChange && (
        <div className="transaction-table-pagination">
          <TablePagination
            total={pagination.total}
            page={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={onPageChange}
          />
        </div>
      )}

      <Modal
        open={confrim}
        title="Delete Confirmation"
        message="Are you sure you want to delete this?"
        onClose={() => setConfrim(false)}
        buttons={
          <>
            <Button
              onClick={() => {
                setConfrim(false);
              }}
              variant="outline"
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              variant="danger"
              loading={isLoading}
              disabled={isLoading}
              onClick={onDelete}
            >
              Confirm
            </Button>
          </>
        }
      />
    </div>
  );
};
