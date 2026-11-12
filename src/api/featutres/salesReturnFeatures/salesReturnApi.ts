import { api } from "../../api";

export const salesReturnApi = api.injectEndpoints({
  endpoints: (builder) => ({
    /**
     * Registers a sales return and deducts the replacement stock.
     *
     * The body is only `{ items: [{ productId, stockId, quantity }] }` — the
     * return number is generated server-side and the user comes from the JWT,
     * so sending either would be rejected by `additionalProperties: false`.
     *
     * "ProductList" is invalidated because a replacement reduces the batch
     * quantity that the product list reports.
     */
    createSalesReturn: builder.mutation({
      query: (data) => ({
        url: "sales-returns",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["SalesReturnList", "ProductList", "Stock"],
    }),

    /**
     * The list endpoint only accepts `page`, `limit` and `search` (matched
     * against the return number) — it rejects any other query param.
     */
    getSalesReturns: builder.query({
      query: ({ limit = 10, page = 1, search }: any) => ({
        url: "sales-returns",
        method: "GET",
        params: { limit, page, search },
      }),
      transformResponse: (response: any) => {
        return response.data;
      },
      providesTags: ["SalesReturnList"],
    }),

    /** A single return with its replacement items. */
    getSalesReturnById: builder.query({
      query: (id) => ({
        url: `sales-returns/${id}`,
        method: "GET",
      }),
      transformResponse: (response: any) => {
        return response.data;
      },
      providesTags: (_, __, id) => {
        return [{ type: "SalesReturn", id }];
      },
    }),
  }),
});

export const {
  useCreateSalesReturnMutation,
  useGetSalesReturnsQuery,
  useGetSalesReturnByIdQuery,
} = salesReturnApi;
