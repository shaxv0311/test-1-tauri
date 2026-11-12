import { ROUTES } from "../../router/routes";

import type { TagTypes } from "../../api/api";

interface HeaderConfigItem {
  path: string;
  title: string;
  description?: string;
  label?: {
    title: string;
    color: string;
  };
  tags?: TagTypes[];
}
export const HEADER_CONFIG: HeaderConfigItem[] = [
  {
    path: ROUTES.DASHBOARD,
    title: "Overview",
    description: "Here is your business summary today.",
    tags: ["Dashboard"],
  },
  {
    path: ROUTES.INVENTORY.BRANDS,
    title: "Brands / Suppliers & Category",
    description:
      "Manage your inventory classifications, vendors and brands in one unified workspace.",
    tags: ["BrandList", "SupplierList", "CategoryList"],
  },
  {
    path: ROUTES.INVENTORY.PURCHASES,
    title: "Purchases & Stock History",
    label: {
      title: "Inventory Records",
      color: "blue",
    },
    tags: ["PurchaseList"],
  },
  {
    path: ROUTES.INVENTORY.PRODUCT_STOCKS,
    title: "Product Stock Batches",
    description:
      "Batch-wise stock quantity, expiry and availability status for this product.",
    label: {
      title: "Stock Detail",
      color: "blue",
    },
    tags: ["ProductList"],
  },
  {
    path: ROUTES.INVENTORY.PRODUCTS,
    title: "Products / Stocks Inventory",
    label: {
      title: "Product Catalog",
      color: "blue",
    },
    tags: ["ProductList"],
  },
  {
    path: ROUTES.ACCOUNTS.INCOME_EXPENSE,
    title: "Income / Expense Cash Flow",
    label: {
      title: "Cash Flow Management",
      color: "green",
    },
    tags: ["IncomeExpenseList"],
  },
  {
    path: ROUTES.ACCOUNTS.REPORT,
    title: "Annual Accounts & Profit Report",
    label: {
      title: "Service Registration",
      color: "blue",
    },
    tags: ["IncomeExpenseReport"],
  },
  {
    path: ROUTES.QUOTATION.NEW_QUOTATION,
    title: "Quotation / Estimate Builder",
    label: {
      title: "Live Preview Enabled",
      color: "blue",
    },
    tags: [],
  },
  {
    path: ROUTES.QUOTATION.QUOTATION_HISTORY,
    title: "Quotation / Estimate History",
    tags: ["QuotationList"],
  },
  {
    path: ROUTES.INVOICE_BILL.NEW_INVOICE_BILL,
    title: "Invoice / Bill Creator & POS",
    label: {
      title: "Live Inventory Synced",
      color: "blue",
    },
    tags: [],
  },
  {
    path: ROUTES.INVOICE_BILL.INVOICE_BILL_HISTORY,
    title: "Invoice / Bill History",
    tags: ["InvoiceList"],
  },

  {
    path: ROUTES.RETURNS.SALES_RETURN,
    title: "Sales Return",
    label: {
      title: "Stock Adjustment",
      color: "blue",
    },
    tags: [],
  },
  {
    path: ROUTES.RETURNS.PURCHASE_RETURN,
    title: "Purchase Return",
    label: {
      title: "Stock Adjustment",
      color: "blue",
    },
    tags: [],
  },
  {
    path: ROUTES.ORDERS.PICKUP,
    title: "Pickup Orders",
    description:
      "Reserve items for customers to collect and mark them delivered when picked up.",
    label: {
      title: "Order Management",
      color: "blue",
    },
    tags: ["PickupOrderList"],
  },
  {
    path: ROUTES.ORDERS.DELIVERY,
    title: "Delivery Orders",
    description: "Manage orders delivered to customers.",
    label: {
      title: "Order Management",
      color: "blue",
    },
    tags: [],
  },
  {
    path: ROUTES.REPLACEMENT.SALES,
    title: "Sales Replacement",
    description:
      "Return swapped items to a stock batch and book the price as an expense.",
    label: {
      title: "Stock Adjustment",
      color: "blue",
    },
    tags: ["SalesReplaceList"],
  },
  {
    path: ROUTES.SETTINGS,
    title: "Settings & Store Identity",
    description:
      "Configure Lekhsmi Computers business profile and explore technology partner portfolio",
    tags: ["Shop"],
  },
];
