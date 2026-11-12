import { CalendarDays, Menu } from "lucide-react";
import { useLocation } from "react-router-dom";
import { HEADER_CONFIG } from "./headerConfig";
import StatusCard from "../ui/StatusCard";
import { formatDateDMY } from "../../helper/date";
// import { TbReload } from "react-icons/tb";
import { api } from "../../api/api";
import {
  shopApi,
  useGetShopQuery,
} from "../../api/featutres/shopFeatures/shopApi";
import { useAppDispatch } from "../../api/hook";
import { ROUTES } from "../../router/routes";
import { useState } from "react";
import logo from "../../assets/software_logo.png";
import shopPlaceholder from "../../assets/shop-placeholder.svg";
const isRouteMatch = (currentPath: string, configPath: string) => {
  // Dynamic route
  if (typeof configPath !== "string") {
    return false;
  }

  if (configPath?.includes(":")) {
    const basePath = configPath?.split("/:")[0];

    // Dynamic routes only match when an :id segment is present
    return currentPath.startsWith(`${basePath}/`);
  }

  // Normal route
  return currentPath === configPath || currentPath.startsWith(`${configPath}/`);
};

interface HeaderProps {
  onMenuClick?: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const location = useLocation();
  const dispatch = useAppDispatch();
  const [refreshing, setRefreshing] = useState(false);
  const { data: shopData } = useGetShopQuery({ gst: true });

  const shopLogo = shopData?.shop?.logo
    ? `${import.meta.env.VITE_APP_USER_IMAGE_URL || ""}${shopData.shop.logo}`
    : shopPlaceholder;
  const header =
    HEADER_CONFIG.find((item) => isRouteMatch(location.pathname, item.path)) ??
    HEADER_CONFIG[0];

  const handleRefresh = async () => {
    setRefreshing(true);
    const startedAt = Date.now();

    try {
      // if (location.pathname === ROUTES.SETTINGS) {
      //   // forceRefetch is the deterministic path: tag invalidation only
      //   // refetches when the cached entries expose intersecting tags,
      //   // which silently does nothing if a query's providesTags drift.
      //   const refresh = dispatch(
      //     shopApi.endpoints.getShop.initiate(
      //       { gst: true },
      //       { forceRefetch: true },
      //     ),
      //   );

      //   try {
      //     await refresh;
      //   } finally {
      //     refresh.unsubscribe();
      //   }

      //   return;
      // }

      if (header.tags?.length) {
        await dispatch(api.util.invalidateTags(header.tags));
        return;
      }

      await dispatch(
        api.util.invalidateTags([
          "BrandList",
          "SupplierList",
          "CategoryList",
          "ProductList",
          "PurchaseList",
          "IncomeExpenseList",
          "QuotationList",
          "Shop",
        ]),
      );
    } finally {
      // invalidateTags dispatches synchronously, so without a minimum the
      // spinner never becomes visible and the click looks like it did nothing.
      const elapsed = Date.now() - startedAt;
      if (elapsed < 700) {
        await new Promise((resolve) => setTimeout(resolve, 700 - elapsed));
      }

      setRefreshing(false);
    }
  };

  return (
    <header className="site-header">
      {/* ================= MOBILE ================= */}
      <div className="header-mobile">
        {/* Top bar: Hamburger + Logo */}
        <div className="header-mobile-bar">
          {/* Left section */}
          <div className="header-mobile-left">
            {/* Hamburger */}
            <button
              type="button"
              onClick={onMenuClick}
              aria-label="Open menu"
              className="header-menu-btn"
            >
              <Menu size={20} />
            </button>

            {/* Logo + Name */}
            <div className="header-brand">
              <img src={logo} alt="BillSpringLite" className="header-logo" />
            </div>
          </div>

          {/* Date */}
          <div className="header-date-chip">
            <CalendarDays size={13} className="shrink-0 text-gray-500" />

            <span className="header-date-text">
              {formatDateDMY(new Date())}
            </span>
          </div>
        </div>
      </div>

      <div className="header-main">
        {/* Page Information */}
        <div className="header-left">
          {/* Hamburger - Tablet only */}
          <button
            type="button"
            onClick={onMenuClick}
            aria-label="Open menu"
            className="header-menu-btn-tablet"
          >
            <Menu size={22} />
          </button>

          <div className="header-info">
            <div className="header-title-block">
              <h1 className="header-title">{header.title}</h1>

              {header.description && (
                <p className="header-desc">{header.description}</p>
              )}
            </div>

            {header.label && (
              <StatusCard
                color={header.label.color}
                status={header.label.title}
                className="status-card-label"
              />
            )}
          </div>
        </div>

        {/* Right Side */}
        <div className="header-right">
          {/* Date - Tablet + Desktop */}
          <div className="header-date-desktop">
            <CalendarDays size={13} className="text-gray-500" />

            <span className="header-date-desktop-text">
              {formatDateDMY(new Date())}
            </span>
          </div>

          {/* Refresh */}
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="header-refresh-btn"
            title="Refresh"
          >
            {/* <TbReload
              size={15}
              className={`text-primary transition-transform ${
                refreshing ? "animate-spin" : ""
              }`}
            /> */}
          </button>

          {/* Shop avatar */}
          <img
            src={shopLogo}
            alt={shopData?.shop?.shop_name || "Shop logo"}
            className="header-shop-avatar"
            onError={(event) => {
              event.currentTarget.src = shopPlaceholder;
            }}
          />
        </div>
      </div>
    </header>
  );
}
