import { api } from "../../api";

export const dashboardApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getDashboard: builder.query<any, void>({
      query: () => ({
        url: "dashboard",
        method: "GET",
      }),

      transformResponse: (response: any) => {
        return response.data;
      },
      providesTags: ["Dashboard"],
    }),

    getYears: builder.query<any, void>({
      query: () => ({
        url: "dashboard/years",
        method: "GET",
      }),
    }),
  }),
});

export const { useGetDashboardQuery, useGetYearsQuery } = dashboardApi;
