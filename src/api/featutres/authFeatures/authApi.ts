import { api } from "../../api";

export const authApi = api.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation({
      query: (data) => {
        return {
          url: "auth/login",
          method: "POST",
          body: data,
        };
      },
    }),

    logout: builder.mutation<void, void>({
      query: () => ({
        url: "auth/logout",
        method: "POST",
      }),
    }),

    getMe: builder.query<any, void>({
      query: () => {
        return {
          url: "auth/me",
          method: "GET",
        };
      },
    }),

    resetPassword: builder.mutation({
      query: (data) => {
        return {
          url: "auth/change-password",
          method: "POST",
          body: data,
        };
      },
    }),
  }),
});

export const {
  useLoginMutation,
  useLogoutMutation,
  useGetMeQuery,
  useResetPasswordMutation,
} = authApi;
