import { api } from "../../api";

export const purchaseReturnApi = api.injectEndpoints({
  endpoints: (builder) => ({
    /**
     * Registers a purchase return and receives the replacement stock.
     *
     * The body is only `{ supplierId?, replacementItems: [{ productId, pack,
     * quantity, batch_no?, expiry_date? }] }` — the return number is generated
     * server-side and the user comes from the JWT, so sending either would be
     * rejected by `additionalProperties: false`.
     *
     * `ProductList` is invalidated because the replacements increase the batch
     * quantities that the product list reports.
     */
    createPurchaseReturn: builder.mutation({
      query: (data) => ({
        url: "purchase-returns",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["PurchaseReturnList", "ProductList", "Dashboard", "Stock"],
    }),

    /**
     * The list endpoint only accepts `page`, `limit` and `search` (matched
     * against the return number) — it rejects any other query param.
     *
     * Rows are headers only: no supplier name and no item lines.
     */
    getPurchaseReturns: builder.query({
      query: ({ limit = 10, page = 1, search }: any) => ({
        url: "purchase-returns",
        method: "GET",
        params: { limit, page, search },
      }),
      transformResponse: (response: any) => {
        return response.data;
      },
      providesTags: ["PurchaseReturnList"],
    }),

    /** A single return with the replacement items it received. */
    getPurchaseReturnById: builder.query({
      query: (id) => ({
        url: `purchase-returns/${id}`,
        method: "GET",
      }),
      transformResponse: (response: any) => {
        return response.data;
      },
      providesTags: (_, __, id) => {
        return [{ type: "PurchaseReturn", id }];
      },
    }),
  }),
});

export const {
  useCreatePurchaseReturnMutation,
  useGetPurchaseReturnsQuery,
  useGetPurchaseReturnByIdQuery,
} = purchaseReturnApi;