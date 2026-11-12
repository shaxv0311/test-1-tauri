import { api } from "../../api";

export const invoiceApi = api.injectEndpoints({
  endpoints: (builder) => ({
    createInvoice: builder.mutation({
      query: (data) => ({
        url: "invoices",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["InvoiceList", "ProductList", "Dashboard", "Stock"],
    }),

    updateInvoice: builder.mutation({
      query: ({ id, data }) => ({
        url: `invoices/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (_, __, { id }) => {
        return [{ type: "Invoice", id }, "InvoiceList"];
      },
    }),

    getPrescriptionRegister: builder.query({
      query: ({ search, year, month, startDate, endDate }) => ({
        url: "invoices/prescription-register",
        method: "GET",
        params: { search, year, month, startDate, endDate },
      }),
      transformResponse: (response: any) => {
        return response.data;
      },
      providesTags: ["InvoiceList"],
    }),

    getInvoice: builder.query({
      query: ({ page = 1, limit = 10, search, year, month }) => ({
        url: "invoices",
        method: "GET",
        params: { page, limit, search, year, month },
      }),
      transformResponse: (response: any) => {
        return response.data;
      },
      providesTags: ["InvoiceList"],
    }),

    getInvoiceById: builder.query({
      query: (id) => ({
        url: `invoices/${id}`,
        method: "GET",
      }),
      transformResponse: (response: any) => {
        return response.data;
      },
      providesTags: (_, __, id) => {
        return [{ type: "Invoice", id }];
      },
    }),

    deleteInvoice: builder.mutation({
      query: (id) => ({
        url: `invoices/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["InvoiceList"],
    }),
  }),
});

export const {
  useCreateInvoiceMutation,
  useUpdateInvoiceMutation,
  useGetPrescriptionRegisterQuery,
  useGetInvoiceQuery,
  useGetInvoiceByIdQuery,
  useDeleteInvoiceMutation,
} = invoiceApi;
