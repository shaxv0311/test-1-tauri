import {
  LayoutDashboard,
  Settings,
  Receipt,
  Tickets,
  Archive,
  Undo2,
  Package,
  ShoppingBag,
  Truck,
  AlertTriangle, Repeat1, ListOrdered
} from "lucide-react";
import { ROUTES } from "../../router/routes";

export interface NavItem {
  icon: any;
  label: string;
  link: string;
  hasSub: boolean;
  menuHeading?: string;
  subLinks?: NavItem[];
}

export const NAV_DATA: NavItem[] = [
  {
    icon: LayoutDashboard,
    label: "Dashboard",
    link: ROUTES.DASHBOARD,
    menuHeading: "Main Menu",
    hasSub: false,
  },
  {
    icon: Archive,
    label: "Inventory",
    link: ROUTES.INVENTORY.ROOT,
    hasSub: true,
    subLinks: [
      {
        icon: Truck,
        label: "Brands / Suppliers",
        link: ROUTES.INVENTORY.BRANDS,
        hasSub: false,
      },
      {
        icon: ShoppingBag,
        label: "Purchases",
        link: ROUTES.INVENTORY.PURCHASES,
        hasSub: false,
      },
      {
        icon: Package,
        label: "Stocks",
        link: ROUTES.INVENTORY.PRODUCTS,
        hasSub: false,
      },
      {
        icon: AlertTriangle,
        label: "Expiring Batches",
        link: ROUTES.INVENTORY.EXPIRING_BATCHES,
        hasSub: false,
      },
    ],
  },
  {
    icon: Tickets,
    label: "Accounts",
    link: ROUTES.ACCOUNTS.ROOT,
    hasSub: true,
    subLinks: [
      {
        icon: Undo2,
        label: "Income / Expense",
        link: ROUTES.ACCOUNTS.INCOME_EXPENSE,
        hasSub: false,
      },
      {
        icon: Package,
        label: "Report",
        link: ROUTES.ACCOUNTS.REPORT,
        hasSub: false,
      },
      {
        icon: Package,
        label: "Audit Report",
        link: ROUTES.ACCOUNTS.AUDIT_REPORT,
        hasSub: false,
      },
    ],
  },
  // {
  //   icon: FileText,
  //   label: "Quotation",
  //   link: ROUTES.QUOTATION.ROOT,
  //   hasSub: true,
  //   subLinks: [
  //     {
  //       label: "New Quotation",
  //       link: ROUTES.QUOTATION.NEW_QUOTATION,
  //     },
  //     {
  //       label: "Quotation History",
  //       link: ROUTES.QUOTATION.QUOTATION_HISTORY,
  //     },
  //   ],
  // },
  {
    icon: Receipt,
    label: "Invoice / Bill",
    link: ROUTES.INVOICE_BILL.ROOT,
    hasSub: true,
    subLinks: [
      {
        icon: Package,
        label: "New Invoice / Bill",
        link: ROUTES.INVOICE_BILL.NEW_INVOICE_BILL,
        hasSub: false,
      },
      {
        icon: Package,
        label: "Invoice History",
        link: ROUTES.INVOICE_BILL.INVOICE_BILL_HISTORY,
        hasSub: false,
      },
    ],
  },
  {
    icon: Undo2,
    label: "Returns",
    link: ROUTES.RETURNS.ROOT,
    hasSub: true,
    subLinks: [
      {
        icon: Undo2,
        label: "New Sales Return",
        link: ROUTES.RETURNS.SALES_RETURN,
        hasSub: false,
      },
      {
        icon: Undo2,
        label: "Sales Return History",
        link: ROUTES.RETURNS.SALES_RETURN_HISTORY,
        hasSub: false,
      },
      // {
      //   icon: Truck,
      //   label: "Purchase Return",
      //   link: ROUTES.RETURNS.PURCHASE_RETURN,
      //   hasSub: false,
      // },
      // {
      //   icon: Truck,
      //   label: "Purchase Return History",
      //   link: ROUTES.RETURNS.PURCHASE_RETURN_HISTORY,
      //   hasSub: false,
      // },
    ],
  },

  // {
  //   icon: ShoppingCart,
  //   label: "Sales",
  //   link: ROUTES.SALES,
  //   hasSub: false,
  // },
  {
    icon: Repeat1,
    label: "Replacement",
    link: ROUTES.REPLACEMENT.ROOT,
    hasSub: true,
    subLinks: [
      {
        icon: Repeat1,
        label: "Sales Replacement",
        link: ROUTES.REPLACEMENT.SALES,
        hasSub: false,
      },

    ],
  },
  {
    icon: ListOrdered,
    label: "Orders",
    link: ROUTES.ORDERS.ROOT,
    hasSub: true,
    subLinks: [
      {
        icon: Undo2,
        label: "Pickup Orders",
        link: ROUTES.ORDERS.PICKUP,
        hasSub: false,
      },
      {
        icon: Undo2,
        label: "Delivery Orders",
        link: ROUTES.ORDERS.DELIVERY,
        hasSub: false,
      },

    ],
  },
  {
    icon: Settings,
    label: "Settings",
    link: ROUTES.SETTINGS,
    hasSub: false,
  },
];
