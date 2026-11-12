import { TrendingDown, TrendingUp } from "lucide-react";
import { formatDateDMY } from "../../../helper/date";
import { IncomeExpenseEntry } from "../../../api/featutres/incomeExpenseFeatures/incomeExpenseApi";

interface TransactionReportProps {
  title: string;
  data: IncomeExpenseEntry[];
  type: "income" | "expense";
  onBodyScroll?: (e: React.UIEvent<HTMLDivElement>) => void;
  loadingMore?: boolean;
}

export const TransactionReport = ({
  title,
  data,
  type,
  onBodyScroll,
  loadingMore,
}: TransactionReportProps) => {
  const isIncome = type === "income";
  const toneClass = isIncome ? "transaction-tone-green" : "transaction-tone-red";

  const total = data?.reduce((sum, item) => sum + item.amount, 0) ?? 0;

  return (
    <div className="transaction-report">
      {/* <div className={`transaction-report-header ${toneClass}`}>
        <div className={`transaction-report-heading ${toneClass}`}>
          {isIncome ? <TrendingUp size={16} /> : <TrendingDown size={16} />}

          <span>
            {title} ({data?.length})
          </span>
        </div>

        <span className={`transaction-report-total ${toneClass}`}>
          {isIncome ? "+" : "-"} ₹{total}
        </span>
      </div> */}

      <div className="transaction-report-body" onScroll={onBodyScroll}>
        {data?.length === 0 ? (
          <div className="transaction-report-empty">No transactions found</div>
        ) : (
          <div className="transaction-report-list">
            {data?.map((item) => (
              <div key={`${item.source}-${item.id}`} className="transaction-report-item">
                <div className="transaction-report-item-info">
                  <span className="transaction-report-item-desc">
                    {item.description ?? "-"}
                    {item.bill_no ? ` (${item.bill_no})` : ""}
                  </span>

                  <span className="transaction-report-item-date">
                    {formatDateDMY(item.date)}
                  </span>
                </div>

                <span
                  className={`transaction-report-item-amount ${toneClass}`}
                >
                  {isIncome ? "+" : "-"} ₹{item.amount.toLocaleString("en-IN")}
                </span>
              </div>
            ))}
          </div>
        )}
        {loadingMore && (
          <div className="text-center text-xs text-txt3">Loading more…</div>
        )}
      </div>
    </div>
  );
};
