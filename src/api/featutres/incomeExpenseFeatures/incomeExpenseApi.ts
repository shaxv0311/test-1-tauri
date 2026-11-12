import { api } from "../../api";

export type IncomeExpenseType = "income" | "expense";
export type IncomeExpenseSource = "sale" | "purchase" | "manual";

export interface IncomeExpenseEntry {
  id: number | string;
  date: string;
  bill_no?: string | null;
  amount: number;
  description: string;
  type: IncomeExpenseType;
  source: IncomeExpenseSource;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface IncomeExpenseListData {
  entries: IncomeExpenseEntry[];
  pagination: PaginationMeta;
}

export interface FinancialSummary {
  total_income: number;
  total_expense: number;
  net_profit: number;
  breakdown: {
    sale_income: number;
    purchase_expense: number;
    manual_income: number;
    manual_expense: number;
  };
}

export interface MonthlyReportRow {
  month: string;
  income: number;
  expense: number;
  net_profit: number;
  status: "profitable" | "loss" | "stable";
}

export interface IncomeExpenseListQuery {
  page?: number;
  limit?: number;
  type?: IncomeExpenseType;
  year?: number;
  month?: number;
}

export interface IncomeExpenseSummaryQuery {
  year?: number;
  month?: number;
}

export interface ManualEntryPayload {
  type: IncomeExpenseType;
  amount: number;
  description?: string;
  date?: string;
}

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

export const incomeExpenseApi = api.injectEndpoints({
  endpoints: (builder) => ({
    createIncomeExpense: builder.mutation<
      ApiEnvelope<unknown>,
      ManualEntryPayload
    >({
      query: (data) => ({
        url: "income-expense",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["IncomeExpenseList", "Dashboard"],
    }),

    getIncomeExpense: builder.query<
      IncomeExpenseListData,
      IncomeExpenseListQuery
    >({
      query: ({ page = 1, limit = 10, type, year, month }) => ({
        url: "income-expense",
        method: "GET",
        params: { page, limit, type, year, month },
      }),
      transformResponse: (response: ApiEnvelope<IncomeExpenseListData>) =>
        response.data,
      providesTags: ["IncomeExpenseList"],
    }),

    getIncomeExpenseSummary: builder.query<
      FinancialSummary,
      IncomeExpenseSummaryQuery
    >({
      query: ({ year, month }) => ({
        url: "income-expense/summary",
        method: "GET",
        params: { year, month },
      }),
      transformResponse: (response: ApiEnvelope<FinancialSummary>) =>
        response.data,
      providesTags: ["IncomeExpenseList"],
    }),

    deleteIncomeExpense: builder.mutation<ApiEnvelope<never>, number>({
      query: (id) => ({
        url: `income-expense/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["IncomeExpenseList", "Dashboard"],
    }),

    getIncomeExpenseAll: builder.query<
      { entries: IncomeExpenseEntry[]; total: number },
      IncomeExpenseListQuery
    >({
      query: ({ type, year, month }) => ({
        url: "income-expense/all",
        method: "GET",
        params: { type, year, month },
      }),
      transformResponse: (
        response: ApiEnvelope<{ entries: IncomeExpenseEntry[]; total: number }>,
      ) => response.data,
      providesTags: ["IncomeExpenseList"],
    }),

    getReport: builder.query<MonthlyReportRow[], { year?: number }>({
      query: ({ year }) => ({
        url: "income-expense/report",
        method: "GET",
        params: { year },
      }),
      transformResponse: (response: ApiEnvelope<{ report: MonthlyReportRow[] }>) =>
        response.data.report,
      providesTags: ["IncomeExpenseReport"],
    }),
  }),
});

export const {
  useCreateIncomeExpenseMutation,
  useGetIncomeExpenseQuery,
  useGetIncomeExpenseSummaryQuery,
  useLazyGetIncomeExpenseAllQuery,
  useDeleteIncomeExpenseMutation,
  useGetReportQuery,
} = incomeExpenseApi;
