import { api } from "../../api";

export type DeliveryOrderStatus = "pending" | "delivered";

export interface DeliveryOrderItemInput {
  productId: number;
  stockId: number;
  quantity: number;
  price: number;
  gst: number;
}

export interface DeliveryOrderItemDetail extends DeliveryOrderItemInput {
  id: number;
  product_name: string | null;
  batch_no: string | null;
  sgst: number | null;
  cgst: number | null;
  total: number;
}

export interface DeliveryOrderRow {
  id: number;
  invoice_no: string;
  patient_name: string | null;
  doctor_name: string | null;
  phone_number: string | null;
  email: string | null;
  address: string | null;
  orderStatus: DeliveryOrderStatus;
  orderDate: string;
  deliveredDate: string;
  discount_type: "percentage" | "amount" | null;
  discount: string | null;
  delivery_charge: string;
  total_amount: string;
  userId: number;
  createdAt: string;
  updatedAt: string;
}

export interface DeliveryOrderDetail extends DeliveryOrderRow {
  items?: DeliveryOrderItemDetail[];
}

export interface DeliveryOrderQueryArg {
  page?: number;
  limit?: number;
  search?: string;
  status?: DeliveryOrderStatus;
  year?: number;
  month?: number;
}

export const deliveryOrderApi = api.injectEndpoints({
  endpoints: (builder) => ({
    /**
     * Creates a delivery order. Stock is NOT deducted here — it is only taken
     * off the batch when the order is marked as delivered.
     */
    createDeliveryOrder: builder.mutation({
      query: (data) => ({
        url: "delivery-orders",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["DeliveryOrderList"],
    }),

    getDeliveryOrders: builder.query({
      query: ({ limit = 10, page = 1, search, status, year, month }: DeliveryOrderQueryArg) => ({
        url: "delivery-orders",
        method: "GET",
        params: { limit, page, search, status, year, month },
      }),
      transformResponse: (response: any) => response.data,
      providesTags: ["DeliveryOrderList"],
    }),

    /** A single order with its line items (product/batch names included). */
    getDeliveryOrderById: builder.query({
      query: (id) => ({
        url: `delivery-orders/${id}`,
        method: "GET",
      }),
      transformResponse: (response: any) => response.data,
      providesTags: (_, __, id) => [{ type: "DeliveryOrder", id }],
    }),

    /** Header / items edit — only allowed while the order is pending. */
    updateDeliveryOrder: builder.mutation({
      query: ({ id, data }) => ({
        url: `delivery-orders/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (_, __, { id }) => [
        { type: "DeliveryOrder", id },
        "DeliveryOrderList",
      ],
    }),

    /**
     * Changing the status to "delivered" deducts the ordered quantity from
     * each batch, so the product/stock lists are refreshed too.
     */
    updateDeliveryOrderStatus: builder.mutation({
      query: ({ id, orderStatus }) => ({
        url: `delivery-orders/${id}/status`,
        method: "PATCH",
        body: { orderStatus },
      }),
      invalidatesTags: (_, __, { id }) => [
        { type: "DeliveryOrder", id },
        "DeliveryOrderList",
        "ProductList",
        "Stock",
      ],
    }),

    /** Delete — only allowed while the order is pending. */
    deleteDeliveryOrder: builder.mutation({
      query: (id) => ({
        url: `delivery-orders/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["DeliveryOrderList"],
    }),
  }),
});

export const {
  useCreateDeliveryOrderMutation,
  useGetDeliveryOrdersQuery,
  useGetDeliveryOrderByIdQuery,
  useUpdateDeliveryOrderMutation,
  useUpdateDeliveryOrderStatusMutation,
  useDeleteDeliveryOrderMutation,
} = deliveryOrderApi;