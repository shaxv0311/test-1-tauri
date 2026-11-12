import { api } from "../../api";

export type PickupOrderStatus = "pending" | "delivered";

export interface PickupOrderItemInput {
  productId: number;
  stockId: number;
  quantity: number;
  price: number;
  gst: number;
}

export interface PickupOrderItemDetail extends PickupOrderItemInput {
  id: number;
  product_name: string | null;
  batch_no: string | null;
  sgst: number | null;
  cgst: number | null;
  total: number;
}

export interface PickupOrderRow {
  id: number;
  customerName: string;
  orderStatus: PickupOrderStatus;
  orderDate: string;
  deliveredDate: string;
  userId: number;
  createdAt: string;
  updatedAt: string;
}

export interface PickupOrderDetail extends PickupOrderRow {
  items?: PickupOrderItemDetail[];
}

export interface PickupOrderQueryArg {
  page?: number;
  limit?: number;
  search?: string;
  status?: PickupOrderStatus;
  year?: number;
  month?: number;
}

export const pickupOrderApi = api.injectEndpoints({
  endpoints: (builder) => ({
    /**
     * Creates a pickup order. Stock is NOT deducted here — it is only taken
     * off the batch when the order is marked as delivered.
     */
    createPickupOrder: builder.mutation({
      query: (data) => ({
        url: "pickup-orders",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["PickupOrderList"],
    }),

    /**
     * The list endpoint accepts `page`, `limit`, `search`, `status`, `year`
     * and `month` and rejects anything else (`additionalProperties: false`).
     */
    getPickupOrders: builder.query({
      query: ({ limit = 10, page = 1, search, status, year, month }: PickupOrderQueryArg) => ({
        url: "pickup-orders",
        method: "GET",
        params: { limit, page, search, status, year, month },
      }),
      transformResponse: (response: any) => response.data,
      providesTags: ["PickupOrderList"],
    }),

    /** A single order with its line items (product/batch names included). */
    getPickupOrderById: builder.query({
      query: (id) => ({
        url: `pickup-orders/${id}`,
        method: "GET",
      }),
      transformResponse: (response: any) => response.data,
      providesTags: (_, __, id) => [{ type: "PickupOrder", id }],
    }),

    /** Header / items edit — only allowed while the order is pending. */
    updatePickupOrder: builder.mutation({
      query: ({ id, data }) => ({
        url: `pickup-orders/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (_, __, { id }) => [
        { type: "PickupOrder", id },
        "PickupOrderList",
      ],
    }),

    /**
     * Changing the status to "delivered" deducts the ordered quantity from
     * each batch, so the product/stock lists are refreshed too.
     */
    updatePickupOrderStatus: builder.mutation({
      query: ({ id, orderStatus }) => ({
        url: `pickup-orders/${id}/status`,
        method: "PATCH",
        body: { orderStatus },
      }),
      invalidatesTags: (_, __, { id }) => [
        { type: "PickupOrder", id },
        "PickupOrderList",
        "ProductList",
        "Stock",
      ],
    }),

    /** Delete — only allowed while the order is pending. */
    deletePickupOrder: builder.mutation({
      query: (id) => ({
        url: `pickup-orders/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["PickupOrderList"],
    }),
  }),
});

export const {
  useCreatePickupOrderMutation,
  useGetPickupOrdersQuery,
  useGetPickupOrderByIdQuery,
  useUpdatePickupOrderMutation,
  useUpdatePickupOrderStatusMutation,
  useDeletePickupOrderMutation,
} = pickupOrderApi;
