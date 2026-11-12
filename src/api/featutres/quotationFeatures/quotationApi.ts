import { api } from "../../api";

export const quotationApi = api.injectEndpoints({
  endpoints: (builder) => ({
    createQuotation: builder.mutation({
      query: (data) => ({
        url: "quotations",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["QuotationList"],
    }),

    updateQuotation: builder.mutation({
      query: ({ id, data }) => {
        return {
          url: `quotations/${id}`,
          method: "PUT",
          body: data,
        };
      },
      invalidatesTags: (_, __, { id }) => {
        return [{ type: "Quotation", id }, "QuotationList"];
      },
    }),

    getQuotation: builder.query({
      query: ({ page = 1, limit = 10, search, year, month }) => ({
        url: "quotations",
        method: "GET",
        params: { page, limit, search, year, month },
      }),
      transformResponse: (response: any) => {
        return response.data;
      },
      providesTags: ["QuotationList"],
    }),

    getQuotationById: builder.query({
      query: (id) => ({
        url: `quotations/${id}`,
        method: "GET",
      }),
      transformResponse: (response: any) => {
        return response.data;
      },
      providesTags: (_, __, id) => {
        return [{ type: "Quotation", id }];
      },
    }),

    deleteQuotation: builder.mutation({
      query: (id) => ({
        url: `quotations/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["QuotationList"],
    }),
  }),
});

export const {
  useCreateQuotationMutation,
  useGetQuotationQuery,
  useGetQuotationByIdQuery,
  useDeleteQuotationMutation,
  useUpdateQuotationMutation,
} = quotationApi;
