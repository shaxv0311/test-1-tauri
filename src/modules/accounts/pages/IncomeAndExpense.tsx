import {
  PlusCircle,
  TrendingDown,
  TrendingUp,
  Wallet,
  ArrowUp,
  ArrowDown,
  CalendarIcon,
} from "lucide-react";
import Input from "../../../components/ui/Input";
import Button from "../../../components/ui/Button";
import { SummaryCard } from "../component/SummaryCard";
import { useState } from "react";
import { TransactionTable } from "../component/TransactionTable";
import { useForm } from "react-hook-form";
import {
  IncomeExpenseForm,
  incomeExpenseSchema,
} from "../../../api/featutres/incomeExpenseFeatures/incomeExpenseSchema";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  useCreateIncomeExpenseMutation,
  useGetIncomeExpenseQuery,
  useGetIncomeExpenseSummaryQuery,
} from "../../../api/featutres/incomeExpenseFeatures/incomeExpenseApi";
import { setToastMessage } from "../../../helper/helper";
import CircleLoader from "../../../components/ui/CircleLoader";
import { CURRENT_MONTH, CURRENT_YEAR, MONTHS } from "../../../utils/constants";

const TRANSACTION_PAGE_LIMIT = 10;
const CURRENT_MONTH_INDEX = MONTHS.indexOf(CURRENT_MONTH) + 1;

export default function IncomeAndExpense() {
  const [activeTable, setActiveTable] = useState<"income" | "expense">(
    "income",
  );
  const [incomePage, setIncomePage] = useState(1);
  const [expensePage, setExpensePage] = useState(1);
  const [createIncomeExpense, { isLoading: isCreateLoading }] =
    useCreateIncomeExpenseMutation();
  const { data: incomeData, isLoading: isIncomeLoading } =
    useGetIncomeExpenseQuery({
      page: incomePage,
      limit: TRANSACTION_PAGE_LIMIT,
      type: "income",
      year: CURRENT_YEAR,
      month: CURRENT_MONTH_INDEX,
    });
  const { data: expenseData, isLoading: isExpenseLoading } =
    useGetIncomeExpenseQuery({
      page: expensePage,
      limit: TRANSACTION_PAGE_LIMIT,
      type: "expense",
      year: CURRENT_YEAR,
      month: CURRENT_MONTH_INDEX,
    });
  const { data: summaryData } = useGetIncomeExpenseSummaryQuery({
    year: CURRENT_YEAR,
    month: CURRENT_MONTH_INDEX,
  });
  const {
    register,
    formState: { errors },
    handleSubmit,
    reset,
    setValue,
    watch,
  } = useForm<IncomeExpenseForm>({
    resolver: zodResolver(incomeExpenseSchema),
    defaultValues: {
      amount: undefined,
      type: "income",
      description: "",
      date: new Date().toISOString().split("T")[0],
    },
  });

  const onSubmit = async (data: IncomeExpenseForm) => {
    const { description, ...rest } = data;

    const payload = {
      ...rest,
      ...(description?.trim() ? { description: description.trim() } : {}),
    };

    try {
      const response = await createIncomeExpense(payload).unwrap();
      if (response?.success) {
        reset();
        setToastMessage("success", response.message || "Success");
      }
    } catch (err: any) {
      if (err?.status === 401) {
        return;
      }
      setToastMessage("error", err.data.message || "Something went wrong");
    }
  };
  const onError = (errors: any) => {
    if (import.meta.env.DEV) {
      console.log("Validation errors:", errors);
    }
  };

  return (
    <div className="section-body income-expense-page">
      <div className="income-expense-summary-row">
        <p className="income-expense-summary-text">
          Showing cash flow for {CURRENT_MONTH} {CURRENT_YEAR}
        </p>

        <div className="income-expense-summary-grid">
          <SummaryCard
            title="Total Income"
            amount={summaryData?.total_income ?? 0}
            icon={<TrendingUp size={17} strokeWidth={3} />}
            color="green"
            sign="+"
          />

          <SummaryCard
            title="Total Expense"
            amount={summaryData?.total_expense ?? 0}
            icon={<TrendingDown size={17} strokeWidth={3} />}
            color="red"
            sign="-"
          />
          <div className="income-expense-summary-span">
            <SummaryCard
              title="Net Balance"
              amount={summaryData?.net_profit ?? 0}
              icon={<Wallet size={17} strokeWidth={3} />}
              color="primary"
            />
          </div>
        </div>
      </div>

      <form
        className="income-expense-form"
        onSubmit={handleSubmit(onSubmit, onError)}
      >
        <div className="income-expense-type-field">
          <label className="income-expense-type-label">Enter Type</label>

          <div className="income-expense-type-toggle">
            <Button
              type="button"
              className={`income-expense-type-btn ${
                watch("type") !== "income" ? "income-expense-type-btn-off" : ""
              }`}
              variant={watch("type") === "income" ? "success" : "others"}
              onClick={() => setValue("type", "income")}
            >
              <ArrowDown size={15} />
              Income
            </Button>

            <Button
              type="button"
              className={`income-expense-type-btn ${
                watch("type") !== "expense" ? "income-expense-type-btn-off" : ""
              }`}
              variant={watch("type") === "expense" ? "danger" : "others"}
              onClick={() => setValue("type", "expense")}
            >
              <ArrowUp size={15} />
              Expense
            </Button>
          </div>
        </div>

        <Input
          label="Date"
          error={errors.date?.message}
          max={new Date().toISOString().split("T")[0]}
          icon={<CalendarIcon className="text-primary" size={15} />}
          labelClassName="text-txt3"
          type="date"
          className="form-input-white text-placeholder"
          {...register("date")}
        />

        <Input
          label="Amount (₹)"
          labelClassName="text-txt3"
          placeholder="e.g. 5000"
          type="number"
          {...register("amount", { valueAsNumber: true })}
          error={errors.amount?.message}
          className="min-w-0"
        />

        <div className="income-expense-desc-field">
          <Input
            label="Reason / Description"
            labelClassName="text-txt3"
            {...register("description")}
            placeholder="e.g. Medicine sales, Electricity bill, Store rent..."
            error={errors.description?.message}
          />
        </div>

        <div className="income-expense-submit-field">
          <label className="income-expense-submit-label">Save</label>
          <Button
            variant={watch("type") === "income" ? "success" : "danger"}
            type="submit"
            className="income-expense-submit-btn"
            loading={isCreateLoading}
            disabled={isCreateLoading}
          >
            <PlusCircle size={20} />
            {watch("type") === "income" ? "Save Income" : "Save Expense"}
          </Button>
        </div>
      </form>

      {isIncomeLoading || isExpenseLoading ? (
        <CircleLoader />
      ) : (
        <div className="income-expense-tables">
          <div className="income-expense-switcher">
            <Button
              type="button"
              className={`income-expense-switch-btn ${
                activeTable === "income"
                  ? "income-expense-switch-btn-active-income"
                  : "income-expense-switch-btn-inactive"
              }`}
              variant="others"
              onClick={() => setActiveTable("income")}
            >
              <TrendingUp size={15} />
              Income Table
            </Button>

            <Button
              type="button"
              className={`income-expense-switch-btn ${
                activeTable === "expense"
                  ? "income-expense-switch-btn-active-expense"
                  : "income-expense-switch-btn-inactive"
              }`}
              variant="others"
              onClick={() => setActiveTable("expense")}
            >
              <TrendingDown size={15} />
              Expense Table
            </Button>
          </div>

          <div className="income-expense-table-row">
            <div
              className={`income-expense-table-slot ${
                activeTable === "income" ? "" : "income-expense-table-hidden"
              }`}
            >
              <TransactionTable
                title="Income Table"
                data={incomeData?.entries || []}
                type="income"
                pagination={incomeData?.pagination}
                onPageChange={setIncomePage}
              />
            </div>

            <div
              className={`income-expense-table-slot ${
                activeTable === "expense" ? "" : "income-expense-table-hidden"
              }`}
            >
              <TransactionTable
                title="Expense Table"
                data={expenseData?.entries || []}
                type="expense"
                pagination={expenseData?.pagination}
                onPageChange={setExpensePage}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
