import { filter } from "../../../../utils/type";
import { api } from "../../../api";

export const inventryApi = api.injectEndpoints({
  endpoints: (builder) => ({
    createBrand: builder.mutation({
      query: (data) => {
        return {
          url: "brands",
          method: "POST",
          body: data,
        };
      },
      invalidatesTags: ["BrandList", "Dashboard"],
    }),

    getBrands: builder.query({
      query: ({ limit = 10, page = 1, search, status }: filter) => {
        return {
          url: `brands`,
          method: "GET",
          params: { limit, page, search, status },
        };
      },
      transformResponse: (response: any) => {
        return response.data;
      },
      providesTags: ["BrandList"],
    }),

    getBrandsById: builder.query({
      query: (id) => {
        return {
          url: `brands/${id}`,
          method: "GET",
        };
      },
      transformResponse: (response: any) => {
        return response.data;
      },
      providesTags: (_, __, id) => {
        return [{ type: "Brand", id }];
      },
    }),

    updateBrand: builder.mutation({
      query: ({ id, data }) => {
        return {
          url: `brands/${id}`,
          method: "PUT",
          body: data,
        };
      },
      invalidatesTags: (_, __, { id }) => {
        return [{ type: "Brand", id }, "BrandList", "Dashboard"];
      },
    }),

    createSupplier: builder.mutation({
      query: (data) => {
        return {
          url: "suppliers",
          method: "POST",
          body: data,
        };
      },
      invalidatesTags: ["SupplierList", "Dashboard"],
    }),

    getSuppliers: builder.query({
      query: ({ limit = 10, page = 1, search, status }: filter) => {
        return {
          url: `suppliers`,
          method: "GET",
          params: { limit, page, search, status },
        };
      },
      transformResponse: (response: any) => {
        return response.data;
      },
      providesTags: ["SupplierList"],
    }),

    getSuppliersById: builder.query({
      query: (id) => {
        return {
          url: `suppliers/${id}`,
          method: "GET",
        };
      },
      transformResponse: (response: any) => {
        return response.data;
      },
      providesTags: (_, __, id) => {
        return [{ type: "Supplier", id }];
      },
    }),

    updateSupplier: builder.mutation({
      query: ({ id, data }) => {
        return {
          url: `suppliers/${id}`,
          method: "PUT",
          body: data,
        };
      },
      invalidatesTags: (_, __, { id }) => {
        return [{ type: "Supplier", id }, "SupplierList", "Dashboard"];
      },
    }),

    createCategory: builder.mutation({
      query: (data) => {
        return {
          url: "categories",
          method: "POST",
          body: data,
        };
      },
      invalidatesTags: ["CategoryList", "Dashboard"],
    }),

    getCategories: builder.query({
      query: ({ limit = 10, page = 1, search, status }: filter) => {
        return {
          url: `categories`,
          method: "GET",
          params: { limit, page, search, status },
        };
      },
      transformResponse: (response: any) => {
        return response.data;
      },
      providesTags: ["CategoryList"],
    }),

    getCategoriesById: builder.query({
      query: (id) => {
        return {
          url: `categories/${id}`,
          method: "GET",
        };
      },
      transformResponse: (response: any) => {
        return response.data;
      },
      providesTags: (_, __, id) => {
        return [{ type: "Category", id }];
      },
    }),

    updateCategory: builder.mutation({
      query: ({ id, data }) => {
        return {
          url: `categories/${id}`,
          method: "PUT",
          body: data,
        };
      },
      invalidatesTags: (_, __, { id }) => {
        return [{ type: "Category", id }, "CategoryList", "Dashboard"];
      },
    }),
  }),
});

export const {
  useCreateBrandMutation,
  useGetBrandsQuery,
  useLazyGetBrandsQuery,
  useGetBrandsByIdQuery,
  useUpdateBrandMutation,

  useCreateSupplierMutation,
  useGetSuppliersQuery,
  useLazyGetSuppliersQuery,
  useGetSuppliersByIdQuery,
  useUpdateSupplierMutation,

  useCreateCategoryMutation,
  useGetCategoriesQuery,
  useLazyGetCategoriesQuery,
  useGetCategoriesByIdQuery,
  useUpdateCategoryMutation,
} = inventryApi;
