import { Wallet, Eye } from "lucide-react";
import Button from "../../../components/ui/Button";
import { SummaryCard } from "../component/SummaryCard";
import { useState } from "react";
import CustomDot from "../../../components/ui/CustomDot";
import Table from "../../../components/table/Table";
import TableHeader from "../../../components/table/TableHeader";
import TableRow from "../../../components/table/TableRow";
import TableCell from "../../../components/table/TableCell";
// import { MdOutlineInsertChartOutlined } from "react-icons/md";
import IconBox from "../../../components/ui/IconBox";
import StatusCard from "../../../components/ui/StatusCard";
import NoData from "../../../components/table/noData";
import MonthlyReport from "../component/MonthlyReport";
import {
  MonthlyReportRow,
  useGetReportQuery,
} from "../../../api/featutres/incomeExpenseFeatures/incomeExpenseApi";
import { CURRENT_YEAR, MONTHS } from "../../../utils/constants";
import CircleLoader from "../../../components/ui/CircleLoader";
import YearDropdown from "../../../components/ui/YearDropdown";
// import {
//   TbTrendingUp,
//   TbTrendingDown,
// } from "react-icons/tb";

const headerItemsDefault = [
  {
    label: "No",
    className: "text-center",
  },
  {
    label: "Month",
  },
  {
    label: "Income (₹) ",
    className: "text-center",
  },
  {
    label: "Expense (₹) ",
    className: "text-center",
  },
  {
    label: "Net Profit (₹) ",
    className: "text-center",
  },
  {
    label: "Status",
    className: "text-center",
  },
  {
    label: "Action",
    className: "text-center",
  },
];

const STATUS_COLOR: Record<string, string> = {
  profitable: "green",
  stable: "orange",
  loss: "red",
};

/**
 * Percentage change of a month against the same figure in the preceding
 * month. Returns null when it cannot be expressed:
 *  - January has no preceding month inside the selected year.
 *  - A jump away from a zero base has no meaningful percentage.
 */
const getMonthChange = (
  rows: MonthlyReportRow[],
  month: string,
  pick: (row: MonthlyReportRow) => number,
) => {
  const monthIndex = MONTHS.indexOf(month);
  if (monthIndex <= 0) return null;

  const current = rows.find((row) => row.month === month);
  const previous = rows.find((row) => row.month === MONTHS[monthIndex - 1]);
  if (!current || !previous) return null;

  const previousValue = pick(previous);
  if (previousValue === 0) return null;

  return ((pick(current) - previousValue) / previousValue) * 100;
};

const MoMChange = ({
  value,
  higherIsBetter,
}: {
  value: number | null;
  higherIsBetter: boolean;
}) => {
  if (value === null) {
    return <span className="report-mom report-mom-none">—</span>;
  }

  const rounded = Math.round(value * 10) / 10;
  const isFlat = rounded === 0;
  const isUp = rounded > 0;
  const isFavourable = isFlat ? null : isUp === higherIsBetter;
  const toneClass = isFlat
    ? "report-mom-flat"
    : isFavourable
      ? "report-mom-good"
      : "report-mom-bad";

  return (
    <span className={`report-mom ${toneClass}`}>
      {!isFlat && (isUp ? "▲" : "▼")}
      {isFlat ? " no change" : ` ${Math.abs(rounded)}%`}
    </span>
  );
};

export default function Report() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [year, setYear] = useState<string | number>(String(CURRENT_YEAR));

  const {
    data: report,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useGetReportQuery({ year: Number(year) });

  const rows = Array.isArray(report) ? report : [];
  const ytdIncome = rows.reduce((sum, item) => sum + item.income, 0);
  const ytdExpense = rows.reduce((sum, item) => sum + item.expense, 0);
  const ytdProfit = ytdIncome - ytdExpense;

  const changeOf = (month: string, pick: (row: MonthlyReportRow) => number) =>
    getMonthChange(rows, month, pick);

  return (
    <div className="section-body report-page">
      <div className="report-summary-row">
        <p className="report-summary-text">
          Showing {year} financial performance & month-over-month growth
        </p>

        <div className="report-summary-grid">
          <SummaryCard
            title="YTD Income"
            amount={ytdIncome}
            // icon={<TbTrendingUp size={17} strokeWidth={3} />}
            color="green"
            sign="+"
          />

          <SummaryCard
            title="YTD Expense"
            amount={ytdExpense}
            // icon={<TbTrendingDown size={17} strokeWidth={3} />}
            color="red"
            sign="-"
          />
          <div className="">
            {/* report-summary-span */}
            <SummaryCard
              title="YTD Net Profit"
              amount={ytdProfit}
              icon={<Wallet size={17} strokeWidth={3} />}
              color="primary"
            />
          </div>
        </div>
      </div>

      <div className="section-body report-tables-section">
        <div className="report-tables-header">
          <div className="report-tables-header-left">
            {/* <IconBox
              // icon={<MdOutlineInsertChartOutlined size={20} />}
              className="bg-primary-08 text-primary"
            /> */}

            <div>
              <h3 className="report-tables-title">
                {year} Monthly Financial Performance
              </h3>

              <p className="report-tables-subtitle">
                click “view” on any month to inspect all income and expense
                entries
              </p>
            </div>
          </div>
          <div className="report-year-wrap">
            <YearDropdown
              value={String(year)}
              onChange={(e) => setYear(e.target.value)}
            />
            <span className="report-year-badge">
              {rows.length} Months
              <CustomDot color="primary" /> {year} Calendar
            </span>
          </div>
        </div>

        {isLoading || isFetching ? (
          <CircleLoader />
        ) : isError ? (
          <div className="text-center py-8 text-txt2">
            <p className="text-lg font-medium">Failed to load report</p>
            <p className="text-sm text-txt3 mt-1">
              Please check your connection and try again.
            </p>
            <Button
              variant="secondary"
              className="mt-4"
              onClick={() => refetch()}
            >
              Retry
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader headerItems={headerItemsDefault} />
            <tbody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={headerItemsDefault.length}
                    className="border-none"
                  >
                    <NoData
                      message="No report available"
                      className="border-none"
                    />
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((item, index) => (
                  <TableRow key={item.month}>
                    <TableCell className="text-center">
                      <span>{index + 1}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-txt1 font-bold">{item.month}</span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="text-green font-bold">
                        ₹{item.income.toLocaleString("en-IN")}
                      </span>

                      {/* <MoMChange
                        value={changeOf(item.month, (row) => row.income)}
                        higherIsBetter
                      /> */}
                    </TableCell>

                    <TableCell className="text-center">
                      <span className="text-red font-bold">
                        ₹{item.expense.toLocaleString("en-IN")}
                      </span>

                      {/* <MoMChange
                        value={changeOf(item.month, (row) => row.expense)}
                        higherIsBetter={false}
                      /> */}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="text-primary font-bold">
                        ₹{item.net_profit.toLocaleString("en-IN")}
                      </span>

                      {/* <MoMChange
                        value={changeOf(item.month, (row) => row.net_profit)}
                        higherIsBetter
                      /> */}
                    </TableCell>
                    <TableCell className="text-center">
                      <StatusCard
                        status={item.status}
                        color={STATUS_COLOR[item.status] || "gray"}
                        isRightShow={true}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="report-view-cell">
                        <Button
                          variant="secondary"
                          className="report-view-btn"
                          onClick={() => {
                            setSelectedMonth(MONTHS.indexOf(item.month) + 1);
                            setIsOpen(true);
                          }}
                        >
                          <Eye size={17} strokeWidth={2} />
                          View
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </tbody>
          </Table>
        )}
      </div>

      <MonthlyReport
        key={`${year}-${selectedMonth ?? "none"}`}
        isOpen={isOpen}
        data={selectedMonth}
        year={Number(year)}
        onClose={() => setIsOpen(false)}
      />
    </div>
  );
}
