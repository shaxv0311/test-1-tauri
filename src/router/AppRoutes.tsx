import { HashRouter, Route, Routes, useNavigate } from "react-router-dom";
import Layout from "../components/layout/Layout";
import Dashboard from "../pages/Dashboard";
import { ROUTES } from "./routes";
import BrandAndSuppliers from "../modules/inventory/pages/BrandAndSuppliers";
import PurchasesAndHistory from "../modules/inventory/pages/PurchasesAndHistory";
import ProductsAndStocks from "../modules/inventory/pages/ProductsAndStocks";
import ProductStockDetail from "../modules/inventory/pages/ProductStockDetail";
import ExpiringBatches from "../modules/inventory/pages/ExpiringBatches";
import IncomeAndExpense from "../modules/accounts/pages/IncomeAndExpense";
import Report from "../modules/accounts/pages/Report";
import Quotation from "../modules/quotation/pages/Quotation";
import InvoiceAndBill from "../modules/invoiceAndBill/pages/InvoiceAndBill";
import Settings from "../modules/settings/pages/Settings";
import { Login } from "../pages/Login";
import { ProtectedRoute } from "./ProtectedRoute";
import QuotationHistory from "../modules/quotation/pages/QuotationHistory";
import InvoiceHistory from "../modules/invoiceAndBill/pages/InvoiceHistory";
import SalesReturn from "../modules/returns/pages/SalesReturn";
import SalesReturnHistory from "../modules/returns/pages/SalesReturnHistory";
import PurchaseReturn from "../modules/returns/pages/PurchaseReturn";
import PurchaseReturnHistory from "../modules/returns/pages/PurchaseReturnHistory";

import SalesReplacement from "../modules/replacement/pages/sales/SalesReplacement";
import AuditReportPage from "../modules/accounts/pages/audit_report/AuditReportPage";
import OrderDeleveryPage from "../modules/orders/page/delivery/OrderDeleveryPage";
import OrdersPickUpPage from "../modules/orders/page/pickup/OrdersPickUpPage";
import { useEffect } from "react";
import { initializePushNotifications } from "../services/pushNotifications";
import PushNotificationHandler from "../services/PushNotificationHandler";
import BiometricStartup from "../services/biometric/BiometricStartup";

export default function AppRoutes() {
  // function PushNotificationHandler() {
  //   const navigate = useNavigate();

  //   useEffect(() => {
  //     let cleanup: (() => void) | undefined;
  //     let cancelled = false;

  //     async function setupPush() {
  //       const remove = await initializePushNotifications(
  //         async (token) => {
  //           console.log("FCM TOKEN:", token);
  //         },
  //         (path) => navigate(path),
  //       );

  //       if (cancelled) {
  //         remove();
  //       } else {
  //         cleanup = remove;
  //       }
  //     }

  //     void setupPush();

  //     return () => {
  //       cancelled = true;
  //       cleanup?.();
  //     };
  //   }, [navigate]);

  //   return null;
  // }

  return (
    <HashRouter>
      <PushNotificationHandler />
      <BiometricStartup>
        <Routes>
          {/* Public */}
          <Route path={ROUTES.LOGIN} element={<Login />} />

          {/* Protected */}
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            {/* Dashboard */}
            <Route path={ROUTES.DASHBOARD} element={<Dashboard />} />

            {/* Inventory */}
            <Route
              path={ROUTES.INVENTORY.BRANDS}
              element={<BrandAndSuppliers />}
            />

            <Route
              path={ROUTES.INVENTORY.PURCHASES}
              element={<PurchasesAndHistory />}
            />

            <Route
              path={ROUTES.INVENTORY.PRODUCTS}
              element={<ProductsAndStocks />}
            />

            <Route
              path={ROUTES.INVENTORY.PRODUCT_STOCKS}
              element={<ProductStockDetail />}
            />

            <Route
              path={ROUTES.INVENTORY.EXPIRING_BATCHES}
              element={<ExpiringBatches />}
            />

            {/* Accounts */}
            <Route
              path={ROUTES.ACCOUNTS.INCOME_EXPENSE}
              element={<IncomeAndExpense />}
            />

            <Route path={ROUTES.ACCOUNTS.REPORT} element={<Report />} />
            <Route
              path={ROUTES.ACCOUNTS.AUDIT_REPORT}
              element={<AuditReportPage />}
            />

            {/* Quotation */}
            <Route
              path={ROUTES.QUOTATION.NEW_QUOTATION}
              element={<Quotation />}
            />

            <Route
              path={ROUTES.QUOTATION.EDIT_QUOTATION}
              element={<Quotation />}
            />

            <Route
              path={ROUTES.QUOTATION.QUOTATION_HISTORY}
              element={<QuotationHistory />}
            />

            {/* Invoice */}
            <Route
              path={ROUTES.INVOICE_BILL.NEW_INVOICE_BILL}
              element={<InvoiceAndBill />}
            />

            <Route
              path={ROUTES.INVOICE_BILL.INVOICE_BILL_HISTORY}
              element={<InvoiceHistory />}
            />

            {/* Returns */}
            <Route
              path={ROUTES.RETURNS.SALES_RETURN}
              element={<SalesReturn />}
            />

            <Route
              path={ROUTES.RETURNS.SALES_RETURN_HISTORY}
              element={<SalesReturnHistory />}
            />

            <Route
              path={ROUTES.RETURNS.PURCHASE_RETURN}
              element={<PurchaseReturn />}
            />

            <Route
              path={ROUTES.RETURNS.PURCHASE_RETURN_HISTORY}
              element={<PurchaseReturnHistory />}
            />
            {/* ORDERS */}

            <Route
              path={ROUTES.ORDERS.DELIVERY}
              element={<OrderDeleveryPage />}
            />
            <Route path={ROUTES.ORDERS.PICKUP} element={<OrdersPickUpPage />} />

            {/* Sales */}
            <Route
              path={ROUTES.REPLACEMENT.SALES}
              element={<SalesReplacement />}
            />

            {/* Settings */}
            <Route path={ROUTES.SETTINGS} element={<Settings />} />
          </Route>

          {/* 404 */}
          {/* <Route path="*" element={<Navigate to={ROUTES.DASHBOARD} replace />} /> */}
        </Routes>
      </BiometricStartup>
    </HashRouter>
  );
}
