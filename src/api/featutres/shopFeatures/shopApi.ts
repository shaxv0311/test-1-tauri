import { api } from "../../api";

export const shopApi = api.injectEndpoints({
  endpoints: (builder) => ({
    createShop: builder.mutation({
      query: (data) => ({
        url: "shop",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Shop"],
    }),

    updateShop: builder.mutation({
      query: (data) => {
        return {
          url: `shop`,
          method: "PUT",
          body: data,
        };
      },
      invalidatesTags: ["Shop"],
    }),

    getShop: builder.query({
      query: (params?: { gst?: boolean }) => {
        return {
          url: "shop",
          method: "GET",
          params,
        };
      },
      transformResponse: (response: any) => {
        return response.data;
      },
      providesTags: ["Shop"],
    }),

    saveShop: builder.mutation({
      query: (data) => ({
        url: "shop/upsert",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Shop"],
    }),
  }),
});

export const {
  useCreateShopMutation,
  useGetShopQuery,
  useUpdateShopMutation,
  useSaveShopMutation,
} = shopApi;
