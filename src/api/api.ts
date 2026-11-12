import {
  createApi,
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
  type FetchBaseQueryMeta,
  type QueryReturnValue,
} from "@reduxjs/toolkit/query/react";
import { setToastMessage } from "../helper/helper";
import { ROUTES } from "../router/routes";
import { _config } from "../config/config";
import { isTauri } from "@tauri-apps/api/core";
import { fetch as tauriFetch } from "@tauri-apps/plugin-http";
export const BASE_URL = import.meta.env.VITE_APP_BASE_URL;

const rawBaseQuery = fetchBaseQuery({
  baseUrl: _config.backend_url,
  // credentials: "include",
  fetchFn: (input, init) => {
    if (isTauri()) {
      return tauriFetch(input, init);
    }

    return fetch(input, init);
  },
  prepareHeaders: (headers) => {
    const token = localStorage.getItem("auth_token");
    if (token) {
      headers.set("authorization", `Bearer ${token}`);
    }
    return headers;
  },
});

const customBaseQuery: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError,
  {},
  FetchBaseQueryMeta
> = async (
  args,
  api,
  extraOptions,
): Promise<
  QueryReturnValue<unknown, FetchBaseQueryError, FetchBaseQueryMeta>
> => {
  const modifiedArgs: FetchArgs =
    typeof args === "string" ? { url: args } : { ...args };

  // const url = modifiedArgs.url || "";

  const result = await rawBaseQuery(modifiedArgs, api, extraOptions);

  if (result.error) {
    const status = result.error.status;

    if (import.meta.env.DEV) {
      console.error(
        "API Error:",
        { status, error: result.error },
        modifiedArgs,
      );
    }

    if (typeof status !== "number") {
      // network error, CORS block, aborted request, etc.
      return { error: result.error, meta: result.meta };
    }

    let message = "Something went wrong";
    // let message;
    if (status === 401) {
      message = "Unauthorized. Please login again.";

      // let errorMessage = message;
      if (
        typeof result.error.data === "object" &&
        result.error.data !== null &&
        "message" in result.error.data
      ) {
        const apiMessage = (result.error.data as { message?: unknown }).message;
        message = String(apiMessage !== "Unauthorized" ? apiMessage : message);
      }
      setToastMessage("error", message);
      const noAutoLogoutUrls = ["auth/login", "auth/change-password"];
      if (!noAutoLogoutUrls.some((u) => modifiedArgs.url === u)) {
        localStorage.removeItem("auth_token");
        window.location.hash = ROUTES.LOGIN;
      }
    } else if (
      typeof result.error.data === "object" &&
      result.error.data !== null &&
      "message" in result.error.data
    ) {
      message = String((result.error.data as { message: unknown }).message);
    } else if (status >= 500) {
      message = "Something went wrong. Please try again later.";
    }
    return {
      error: { status, data: { message } },
      meta: result.meta,
    };
  }

  if (import.meta.env.DEV) {
    // console.log("API Success:", { data: result.data }, modifiedArgs);
  }

  return { data: result.data, meta: result.meta };
};

export const TAG_TYPES = [
  "Dashboard",
  "BrandList",
  "Brand",
  "SupplierList",
  "Supplier",
  "CategoryList",
  "Category",
  "ProductList",
  "Product",
  "PurchaseList",
  "Purchase",
  "IncomeExpenseList",
  "IncomeExpenseReport",
  "QuotationList",
  "Quotation",
  "InvoiceList",
  "Invoice",
  "SalesReturnList",
  "SalesReturn",
  "PurchaseReturnList",
  "PurchaseReturn",
  "SalesReplaceList",
  "SalesReplace",
  "PickupOrderList",
  "PickupOrder",
  "DeliveryOrderList",
  "DeliveryOrder",
  "Shop",
  "Stock",
] as const;

export type TagTypes = (typeof TAG_TYPES)[number];

export const api = createApi({
  reducerPath: "api",
  baseQuery: customBaseQuery,
  refetchOnFocus: true,
  refetchOnReconnect: true,
  refetchOnMountOrArgChange: true,
  tagTypes: [...TAG_TYPES],
  endpoints: () => ({}),
});
