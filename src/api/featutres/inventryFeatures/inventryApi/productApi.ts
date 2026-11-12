import { api } from "../../../api";

export const productApi = api.injectEndpoints({
  endpoints: (builder) => ({
    createProduct: builder.mutation({
      query: (data) => {
        return {
          url: "products",
          method: "POST",
          body: data,
        };
      },
      invalidatesTags: ["ProductList", "Dashboard", "Stock"],
    }),

    getproducts: builder.query({
      query: ({ limit = 10, page = 1, search, status }) => {
        return {
          url: `products`,
          method: "GET",
          params: { limit, page, search, status },
        };
      },
      transformResponse: (response: any) => {
        return response.data;
      },
      providesTags: ["ProductList"],
    }),

    getProductsById: builder.query({
      query: (id) => {
        return {
          url: `products/${id}`,
          method: "GET",
        };
      },
      transformResponse: (response: any) => {
        return response.data;
      },
      providesTags: (_, __, id) => {
        return [{ type: "Product", id }];
      },
    }),

    /**
     * Stock batches for a product. Same URL as getProductsById, but the caller
     * controls the page size — the default limit is only 10, which silently
     * truncates the batch list on products with many batches.
     */
    getProductBatches: builder.query({
      query: (arg: number | string | { id: number | string; page?: number; limit?: number }) => {
        const id = typeof arg === "object" ? arg.id : arg;
        const page = typeof arg === "object" ? (arg.page ?? 1) : 1;
        const limit = typeof arg === "object" ? (arg.limit ?? 100) : 100;
        return {
          url: `products/${id}`,
          method: "GET",
          params: { page, limit },
        };
      },
      transformResponse: (response: any) => {
        return response.data;
      },
      providesTags: (_, __, arg) => {
        const id = typeof arg === "object" ? arg.id : arg;
        return [{ type: "Product", id }, "Stock"];
      },
    }),

    /**
     * Latest purchase of a product from each supplier that supplied it.
     * URL: GET /products/:id/purchases. Supports supplier filtering plus
     * page/limit pagination.
     */
    getProductPurchases: builder.query({
      query: (arg: {
        id: number | string;
        page?: number;
        limit?: number;
        supplierId?: number | string;
      }) => {
        const { id, page = 1, limit = 10, supplierId } = arg;
        return {
          url: `products/${id}/purchases`,
          method: "GET",
          params: { page, limit, supplierId },
        };
      },
      transformResponse: (response: any) => {
        return response.data;
      },
      providesTags: (_, __, arg) => [
        { type: "Product", id: arg.id },
        "PurchaseList",
      ],
    }),

    getExpiringBatches: builder.query({
      query: ({ filter, page = 1, limit = 10, search }) => {
        return {
          url: `products/expiring-batches`,
          method: "GET",
          params: { filter, page, limit, search },
        };
      },
      transformResponse: (response: any) => {
        return response.data;
      },
      providesTags: ["ProductList"],
    }),

    updateProduct: builder.mutation({
      query: ({ id, data }) => {
        return {
          url: `products/${id}`,
          method: "PUT",
          body: data,
        };
      },
      invalidatesTags: (_, __, { id }) => {
        return [{ type: "Product", id }, "ProductList", "Dashboard", "Stock"];
      },
    }),

    /**
     * Updates a single stock batch's status without touching quantities.
     * URL: PATCH /products/:productId/stock/:stockId
     */
    updateStockStatus: builder.mutation({
      query: ({ productId, stockId, stock_status }) => ({
        url: `products/${productId}/stock/${stockId}`,
        method: "PATCH",
        body: { stock_status },
      }),
      invalidatesTags: (_, __, { productId }) => {
        return [{ type: "Product", productId }, "ProductList", "Stock"];
      },
    }),
  }),
});

export const {
  useCreateProductMutation,
  useGetproductsQuery,
  useLazyGetproductsQuery,
  useGetProductsByIdQuery,
  useGetProductBatchesQuery,
  useLazyGetProductBatchesQuery,
  useGetProductPurchasesQuery,
  useGetExpiringBatchesQuery,
  useUpdateProductMutation,
  useUpdateStockStatusMutation,
} = productApi;
