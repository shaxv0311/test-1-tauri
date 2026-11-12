import { api } from "../../../api";

export const purchaseApi = api.injectEndpoints({
  endpoints: (builder) => ({
    createPurchase: builder.mutation({
      query: (data) => {
        return {
          url: "purchases",
          method: "POST",
          body: data,
        };
      },
      invalidatesTags: ["PurchaseList", "ProductList", "Stock"],
    }),

    getPurchases: builder.query({
      query: ({ limit = 10, page = 1, search }) => {
        return {
          url: `purchases`,
          method: "GET",
          params: { limit, page, search },
        };
      },
      transformResponse: (response: any) => {
        return response.data;
      },
      providesTags: ["PurchaseList", "ProductList"],
    }),

    updatePurchase: builder.mutation({
      query: ({ id, data }) => {
        return {
          url: `purchases/${id}`,
          method: "PUT",
          body: data,
        };
      },
      invalidatesTags: (_, __, { id }) => {
        return [{ type: "Purchase", id }, "PurchaseList", "ProductList", "Stock"];
      },
    }),

    getPurchaseById: builder.query({
      query: (id) => {
        return {
          url: `purchases/${id}`,
          method: "GET",
        };
      },
      transformResponse: (response: any) => {
        return response.data;
      },
      providesTags: (_, __, id) => {
        return [{ type: "Purchase", id }, "ProductList"];
      },
    }),
  }),
});

export const {
  useCreatePurchaseMutation,
  useGetPurchasesQuery,
  useUpdatePurchaseMutation,
  useGetPurchaseByIdQuery,
} = purchaseApi;
