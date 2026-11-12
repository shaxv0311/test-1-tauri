import { CalendarDays, FileSpreadsheet, Wallet } from "lucide-react";
// import {
//   TbTrendingUp,
//   TbTrendingDown,
// } from "react-icons/tb";
import CloseIcon from "../../../components/ui/CloseIcon";
import { ModalProps } from "../../../utils/type";
import IconBox from "../../../components/ui/IconBox";
import { SummaryCard } from "./SummaryCard";
import { TransactionReport } from "./TransactionReport";
import {
  IncomeExpenseEntry,
  useGetIncomeExpenseQuery,
  useGetIncomeExpenseSummaryQuery,
  useLazyGetIncomeExpenseAllQuery,
} from "../../../api/featutres/incomeExpenseFeatures/incomeExpenseApi";
import { MONTHS } from "../../../utils/constants";
import CircleLoader from "../../../components/ui/CircleLoader";
import { useEffect, useState } from "react";
import Button from "../../../components/ui/Button";
import { downloadIncomeExpenseXlsx } from "../../../helper/excel";
import { setToastMessage } from "../../../helper/helper";

const MONTHLY_TRANSACTION_LIMIT = 10;

export default function MonthlyReport({
  onClose,
  data,
  isOpen,
  year,
}: ModalProps & { year?: number }) {
  const [activeTable, setActiveTable] = useState<"income" | "expense">(
    "income",
  );
  const [incomePage, setIncomePage] = useState(1);
  const [expensePage, setExpensePage] = useState(1);
  const month: number | undefined = data ?? undefined;
  const [getAllEntries] = useLazyGetIncomeExpenseAllQuery();
  const [isExporting, setIsExporting] = useState(false);
  const { data: summary, isFetching: isSummaryFetching } =
    useGetIncomeExpenseSummaryQuery({ year, month }, { skip: !month });
  const { data: incomeData, isFetching: isIncomeFetching } =
    useGetIncomeExpenseQuery(
      {
        page: incomePage,
        limit: MONTHLY_TRANSACTION_LIMIT,
        type: "income",
        year,
        month,
      },
      { skip: !month },
    );
  const { data: expenseData, isFetching: isExpenseFetching } =
    useGetIncomeExpenseQuery(
      {
        page: expensePage,
        limit: MONTHLY_TRANSACTION_LIMIT,
        type: "expense",
        year,
        month,
      },
      { skip: !month },
    );

  const [incomeEntries, setIncomeEntries] = useState<IncomeExpenseEntry[]>([]);
  const [expenseEntries, setExpenseEntries] = useState<IncomeExpenseEntry[]>(
    [],
  );

  const isInitialLoading =
    isSummaryFetching ||
    (isIncomeFetching && incomeEntries.length === 0) ||
    (isExpenseFetching && expenseEntries.length === 0);

  // Reset before the data effects populate: effects run in declaration order,
  // so clearing here first keeps cached data from being wiped right after the
  // data effects set it (which left the popup on "No transactions found"
  // until a page refresh).
  useEffect(() => {
    setIncomePage(1);
    setExpensePage(1);
    setIncomeEntries([]);
    setExpenseEntries([]);
  }, [month, year]);

  useEffect(() => {
    if (!incomeData) return;
    setIncomeEntries((prev) =>
      incomePage === 1 ? incomeData.entries : [...prev, ...incomeData.entries],
    );
  }, [incomeData, incomePage]);

  useEffect(() => {
    if (!expenseData) return;
    setExpenseEntries((prev) =>
      expensePage === 1
        ? expenseData.entries
        : [...prev, ...expenseData.entries],
    );
  }, [expenseData, expensePage]);

  const handleIncomeScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    if (
      el.scrollTop + el.clientHeight >= el.scrollHeight - 40 &&
      incomeData?.pagination?.hasNextPage &&
      !isIncomeFetching
    ) {
      setIncomePage((p) => p + 1);
    }
  };

  const handleExpenseScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    if (
      el.scrollTop + el.clientHeight >= el.scrollHeight - 40 &&
      expenseData?.pagination?.hasNextPage &&
      !isExpenseFetching
    ) {
      setExpensePage((p) => p + 1);
    }
  };

  // const handleExport = async () => {
  //   if (!month) return;

  //   setIsExporting(true);

  //   try {
  //     const res = await getAllEntries({
  //       year,
  //       month,
  //     }).unwrap();

  //     const exportData = {
  //       type: "export-income-expense",
  //       monthLabel: MONTHS[month - 1],
  //       year: year ?? new Date().getFullYear(),
  //       entries: res?.entries ?? [],
  //       reportedTotal: res?.total,
  //     };

  //       // Normal browser
  //       await downloadIncomeExpenseXlsx(exportData);

  //       setToastMessage(
  //         "success",
  //         "Excel file downloaded successfully"
  //       );

  //   } catch (error) {
  //     console.error(
  //       "Failed to export income/expense report:",
  //       error
  //     );

  //     setToastMessage(
  //       "error",
  //       "Failed to export Excel file"
  //     );
  //   } finally {
  //     setIsExporting(false);
  //   }
  // };

  const handleExport = async () => {
    if (!month) return;

    setIsExporting(true);

    try {
      const res = await getAllEntries({
        year,
        month,
      }).unwrap();

      const exportData = {
        type: "export-income-expense",
        monthLabel: MONTHS[month - 1],
        year: year ?? new Date().getFullYear(),
        entries: res?.entries ?? [],
        reportedTotal: res?.total,
      };

      await downloadIncomeExpenseXlsx(exportData);

      setToastMessage("success", "Excel file is being prepared...");
    } catch (error) {
      console.error("Failed to export income/expense report:", error);

      setToastMessage("error", "Failed to export Excel file");
    } finally {
      setIsExporting(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="monthly-report-overlay">
      <div className="monthly-report-panel">
        <div className="monthly-report-header">
          <div className="monthly-report-header-left">
            <IconBox
              icon={<CalendarDays size={23} />}
              className="bg-primary-08 text-primary"
            />

            <div className="monthly-report-title-wrap">
              <h3 className="monthly-report-title">
                {month ? MONTHS[month - 1] : ""} • Transaction Breakdown
              </h3>

              <p className="monthly-report-subtitle">
                Completed chronological logs of all income and expense entries
                for this month
              </p>
            </div>
          </div>

          <div className="monthly-report-header-actions">
            <Button
              variant="success"
              className="monthly-report-export-btn"
              onClick={handleExport}
              disabled={isInitialLoading || isExporting}
              title="Download this month as an Excel file"
            >
              {isExporting ? (
                <span
                  className="inline-block rounded-full border-2 border-white border-t-transparent animate-spin"
                  style={{ width: 14, height: 14 }}
                />
              ) : (
                <FileSpreadsheet size={16} strokeWidth={2} />
              )}
              {isExporting ? "Exporting…" : "Export XL"}
            </Button>

            <CloseIcon onClose={onClose} />
          </div>
        </div>
        {isInitialLoading ? (
          <CircleLoader />
        ) : (
          <div className="monthly-report-content">
            <div className="monthly-report-summary-grid">
              <SummaryCard
                title="Total Income"
                amount={summary?.total_income ?? 0}
                // icon={<TbTrendingUp size={17} strokeWidth={3} />}
                color="green"
                sign="+"
              />

              <SummaryCard
                title="Total Expense"
                amount={summary?.total_expense ?? 0}
                // icon={<TbTrendingDown size={17} strokeWidth={3} />}
                color="red"
                sign="-"
              />
              <div className="monthly-report-summary-span">
                <SummaryCard
                  title="Net Balance"
                  amount={summary?.net_profit ?? 0}
                  icon={<Wallet size={17} strokeWidth={3} />}
                  color="primary"
                />
              </div>
            </div>{" "}
            <div className="monthly-report-main">
              <div className="monthly-report-switcher">
                <Button
                  type="button"
                  className={`monthly-report-switch-btn ${
                    activeTable === "income"
                      ? "monthly-report-switch-btn-active-income"
                      : "monthly-report-switch-btn-inactive"
                  }`}
                  variant="others"
                  onClick={() => setActiveTable("income")}
                >
                  {/* <TbTrendingUp size={15} /> */}
                  Income Table
                </Button>

                <Button
                  type="button"
                  className={`monthly-report-switch-btn ${
                    activeTable === "expense"
                      ? "monthly-report-switch-btn-active-expense"
                      : "monthly-report-switch-btn-inactive"
                  }`}
                  variant="others"
                  onClick={() => setActiveTable("expense")}
                >
                  {/* <TbTrendingDown size={15} /> */}
                  Expense Table
                </Button>
              </div>

              <div className="monthly-report-tables">
                <div
                  className={`monthly-report-table-slot ${
                    activeTable === "income"
                      ? ""
                      : "monthly-report-table-hidden"
                  }`}
                >
                  <TransactionReport
                    title="Income Transaction"
                    data={incomeEntries}
                    type="income"
                    onBodyScroll={handleIncomeScroll}
                    loadingMore={isIncomeFetching && incomePage > 1}
                  />
                </div>

                <div
                  className={`monthly-report-table-slot ${
                    activeTable === "expense"
                      ? ""
                      : "monthly-report-table-hidden"
                  }`}
                >
                  <TransactionReport
                    title="Expense Transaction"
                    data={expenseEntries}
                    type="expense"
                    onBodyScroll={handleExpenseScroll}
                    loadingMore={isExpenseFetching && expensePage > 1}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
