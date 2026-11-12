import { api } from "../../api";

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

/**
 * A replacement row as the API reports it. `price` is a `decimal` column on the
 * server but is coerced to a number before it leaves the service layer.
 *
 * `quantity` is in **pieces** (packs x pack size), matching `batch_total_quantity`
 * on the stock batch — the replacement adds this many pieces back to the batch.
 */
export interface SalesReplaceRow {
  id: number;
  productId: number;
  product_name: string;
  stockId: number;
  batch_no: string | null;
  expiry_date: string | null;
  quantity: number;
  price: number;
  /** Link to the auto-created `income_expense` row, so deleting also clears it. */
  incomeExpenseId: number | null;
  userId: number;
  createdAt: string;
  updatedAt: string;
}

export interface SalesReplaceListData {
  salesReplaces: SalesReplaceRow[];
  pagination: PaginationMeta;
}

/** The body `POST /sales-replace` accepts — `additionalProperties: false`. */
export interface SalesReplacePayload {
  productId: number;
  stockId: number;
  quantity: number;
  price: number;
  description?: string;
}

/**
 * What a create returns: the saved record, the expense the server booked, and
 * the batch totals after the stock was added back.
 */
export interface SalesReplaceCreateResult {
  salesReplace: SalesReplaceRow;
  expense: {
    id: number;
    amount: string | number;
    type: string;
    description: string;
  } | null;
  stock: {
    id: number;
    quantity: number;
    batch_total_quantity: number;
    stock_status: string;
  };
}

export interface SalesReplaceQuery {
  page?: number;
  limit?: number;
  search?: string;
}

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

export const salesReplaceApi = api.injectEndpoints({
  endpoints: (builder) => ({
    /**
     * Books a replacement: adds the quantity back to the batch, records the
     * price as an expense, and stores the link between the two.
     *
     * "ProductList" and "IncomeExpenseList" are invalidated because both the
     * product's total quantity and the ledger change on a successful create.
     */
    createSalesReplace: builder.mutation<
      ApiEnvelope<SalesReplaceCreateResult>,
      SalesReplacePayload
    >({
      query: (body) => ({
        url: "sales-replace",
        method: "POST",
        body,
      }),
      invalidatesTags: [
        "SalesReplaceList",
        "ProductList",
        "IncomeExpenseList",
        "Dashboard",
        "Stock",
      ],
    }),

    /** `search` matches product name or batch number. */
    getSalesReplaces: builder.query<
      SalesReplaceListData,
      SalesReplaceQuery
    >({
      query: ({ page = 1, limit = 10, search }) => ({
        url: "sales-replace",
        method: "GET",
        params: { page, limit, search },
      }),
      transformResponse: (response: ApiEnvelope<SalesReplaceListData>) =>
        response.data,
      providesTags: ["SalesReplaceList"],
    }),

    getSalesReplaceById: builder.query<
      { salesReplace: SalesReplaceRow },
      number
    >({
      query: (id) => ({
        url: `sales-replace/${id}`,
        method: "GET",
      }),
      transformResponse: (
        response: ApiEnvelope<{ salesReplace: SalesReplaceRow }>,
      ) => response.data,
      providesTags: (_, __, id) => [{ type: "SalesReplace", id }],
    }),

    /** Reverses the create: stock is deducted again and the expense row removed. */
    deleteSalesReplace: builder.mutation<ApiEnvelope<never>, number>({
      query: (id) => ({
        url: `sales-replace/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [
        "SalesReplaceList",
        "ProductList",
        "IncomeExpenseList",
        "Dashboard",
        "Stock",
      ],
    }),
  }),
});

export const {
  useCreateSalesReplaceMutation,
  useGetSalesReplacesQuery,
  useGetSalesReplaceByIdQuery,
  useDeleteSalesReplaceMutation,
} = salesReplaceApi;