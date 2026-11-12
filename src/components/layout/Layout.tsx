import { Outlet, useLocation } from "react-router-dom";
import Header from "./Header";
import SideBar from "./SideBar";
import { ROUTES } from "../../router/routes";
import NetworkError from "../ui/NetworkError";
import { useEffect, useState } from "react";

export default function Layout() {
  const location = useLocation();

  const noPaddingPages: string[] = [
    ROUTES.QUOTATION.NEW_QUOTATION,
    ROUTES.INVOICE_BILL.NEW_INVOICE_BILL,
  ];

  const noPadding = noPaddingPages.includes(location.pathname);

  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [sidebarOpen, setSidebarOpen] = useState(
    () => window.innerWidth >= 1024,
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    const handleResize = () => setSidebarOpen(window.innerWidth >= 1024);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const closeSidebarOnMobile = () => {
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  };

  return (
    <div className="layout-shell">
      <SideBar isOpen={sidebarOpen} onClose={closeSidebarOnMobile} />

      <main className="layout-main">
        <Header onMenuClick={() => setSidebarOpen(true)} />

        {/* Page Area */}
        <div
          className={`layout-content ${
            noPadding ? "layout-content-no-pad" : ""
          }`}
        >
          {!isOnline ? <NetworkError /> : <Outlet />}
        </div>
      </main>
    </div>
  );
}
