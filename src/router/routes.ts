export const ROUTES = {
  LOGIN: "/login",
  DASHBOARD: "/",

  INVENTORY: {
    ROOT: "/inventory",
    BRANDS: "/inventory/brands-suppliers",
    PURCHASES: "/inventory/purchases",
    PRODUCTS: "/inventory/stocks",
    PRODUCT_STOCKS: "/inventory/stocks/:id",
    EXPIRING_BATCHES: "/inventory/expiring-batches",
  },

  ACCOUNTS: {
    ROOT: "/accounts",
    INCOME_EXPENSE: "/accounts/income-expense",
    REPORT: "/accounts/report",
    AUDIT_REPORT: "/accounts/audit-reprot",

  },

  QUOTATION: {
    ROOT: "/quotation",
    NEW_QUOTATION: "/quotation/new-quotation",
    QUOTATION_HISTORY: "/quotation/quotation-history",
    EDIT_QUOTATION: "/quotation/new-quotation/:id",
  },

  INVOICE_BILL: {
    ROOT: "/invoice-bill",
    NEW_INVOICE_BILL: "/invoice-bill/new-invoice-bill",
    INVOICE_BILL_HISTORY: "/invoice-bill/invoice-bill-history",
  },

  RETURNS: {
    ROOT: "/returns",
    SALES_RETURN: "/returns/sales-return",
    SALES_RETURN_HISTORY: "/returns/sales-return-history",
    PURCHASE_RETURN: "/returns/purchase-return",
    PURCHASE_RETURN_HISTORY: "/returns/purchase-return-history",
  },
  ORDERS: {
    ROOT: "/orders",
    PICKUP: "/orders/pickup",
    DELIVERY: "/orders/delivery",
  },
  REPLACEMENT: {
    ROOT: "/replacement",
    SALES: "/replacement/sales-replacement",
  },


  SETTINGS: "/settings",
} as const;
