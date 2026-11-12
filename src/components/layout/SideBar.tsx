import { NavLink } from "react-router-dom";
import { useState } from "react";
import { ChevronDown, ChevronRight, LogOut, Menu, X } from "lucide-react";
import { NAV_DATA, type NavItem } from "./sideBarMenuConfig";

import { useGetShopQuery } from "../../api/featutres/shopFeatures/shopApi";
import { ROUTES } from "../../router/routes";
import { useLogoutMutation } from "../../api/featutres/authFeatures/authApi";
import { setToastMessage } from "../../helper/helper";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import icon from "../../assets/software_logo.png";

interface SideBarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function SideBar({ isOpen = false, onClose }: SideBarProps) {
  const [openMenus, setOpenMenus] = useState<string[]>(
    NAV_DATA.filter((item) => item.hasSub).map((item) => item.link),
  );
  const [confrim, setConfrim] = useState(false);

  const [logout, { isLoading }] = useLogoutMutation();
  const { data: shopData } = useGetShopQuery({ gst: true });

  const handleLogout = async () => {
    try {
      await logout().unwrap();
      setConfrim(false);
    } catch (error) {
      setConfrim(false);
    } finally {
      localStorage.clear();
      setToastMessage("success", "Logout successful");
      setConfrim(false);
      window.location.hash = ROUTES.LOGIN;
    }
  };

  const toggleMenu = (link: string) => {
    setOpenMenus((prev) =>
      prev.includes(link) ? prev.filter((l) => l !== link) : [...prev, link],
    );
  };

  const renderSubLinks = (subLinks: NavItem[], level = 1) => {
    const isSubLevel = level > 1;
    const submenuClass = isSubLevel
      ? "sidebar-submenu-level2"
      : "sidebar-submenu";
    const linkClass = isSubLevel
      ? "sidebar-sub-link-level2"
      : "sidebar-sub-link";
    const dotClass = isSubLevel ? "sidebar-sub-dot-level2" : "sidebar-sub-dot";

    return (
      <div className={submenuClass}>
        {subLinks?.map((sub) => {
          const SubIcon = sub.icon;
          const hasChildren =
            sub.hasSub && sub.subLinks && sub.subLinks.length > 0;

          return (
            <div key={sub.label}>
              {hasChildren ? (
                <>
                  <button
                    type="button"
                    onClick={() => toggleMenu(sub.link)}
                    className="sidebar-parent-btn"
                    style={{ paddingLeft: isSubLevel ? "36px" : "24px" }}
                  >
                    <div className="sidebar-link-left">
                      {SubIcon && <SubIcon size={16} />}
                      <span>{sub.label}</span>
                    </div>
                    <ChevronRight
                      size={14}
                      className={`sidebar-chevron ${
                        openMenus.includes(sub.link)
                          ? "sidebar-chevron-open"
                          : ""
                      }`}
                    />
                  </button>
                  {openMenus.includes(sub.link) &&
                    renderSubLinks(sub.subLinks!, level + 1)}
                </>
              ) : (
                <NavLink
                  to={sub.link}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `${linkClass} ${isActive ? `${linkClass}-active` : ""}`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span
                        className={`${dotClass} ${isActive ? "bg-white" : "bg-gray-300"}`}
                      />
                      {sub.label}
                    </>
                  )}
                </NavLink>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <>
      {/* Backdrop (mobile & tablet) */}
      {isOpen && <div className="sidebar-backdrop" onClick={onClose} />}

      <aside
        className={`sidebar ${isOpen ? "sidebar-open" : "sidebar-closed"}`}
      >
        {/* Logo / Title */}
        <div className="sidebar-inner">
          <div className="sidebar-brand">
            <div className="sidebar-brand-left">
              <img
                src={icon}
                // src={
                //   shopData?.shop?.logo
                //     ? `${import.meta.env.VITE_APP_USER_IMAGE_URL}${shopData.shop.logo}`
                //     : shopPlaceholder
                // }
                // alt={shopData?.shop?.shop_name || "Shop logo"}
                className="sidebar-logo"
              />
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close menu"
              className="sidebar-close-btn"
            >
              <X size={20} />
            </button>
          </div>

          {/* Menu */}
          <div className="sidebar-menu">
            <div className="sidebar-menu-list">
              {NAV_DATA.map((item) => {
                const Icon = item.icon;
                const hasChildren =
                  item.hasSub && item.subLinks && item.subLinks.length > 0;

                return (
                  <div key={item.label}>
                    {/* Menu Heading */}
                    {item.menuHeading && (
                      <p className="sidebar-menu-heading">{item.menuHeading}</p>
                    )}

                    {/* Main Menu Without Submenu */}
                    {!hasChildren ? (
                      <NavLink
                        to={item.link}
                        end={item.link === "/"}
                        onClick={onClose}
                        className={({ isActive }) =>
                          `sidebar-link ${isActive ? "sidebar-link-active" : ""}`
                        }
                      >
                        {({ isActive }) => (
                          <>
                            <div className="sidebar-link-left">
                              <Icon size={18} />
                              <span>{item.label}</span>
                            </div>
                            <span
                              className={`sidebar-link-dot ${isActive ? "bg-white" : "bg-transparent"}`}
                            />
                          </>
                        )}
                      </NavLink>
                    ) : (
                      <>
                        {/* Parent Menu */}
                        <button
                          type="button"
                          onClick={() => toggleMenu(item.link)}
                          className="sidebar-parent-btn"
                        >
                          <div className="sidebar-link-left">
                            <Icon size={18} />
                            <span>{item.label}</span>
                          </div>
                          <ChevronDown
                            size={16}
                            className={`sidebar-chevron ${
                              openMenus.includes(item.link)
                                ? "sidebar-chevron-open"
                                : ""
                            }`}
                          />
                        </button>

                        {/* Sub Menu */}
                        {openMenus.includes(item.link) &&
                          renderSubLinks(item.subLinks ?? [])}
                      </>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="sidebar-logout">
              <Button
                onClick={() => setConfrim(true)}
                variant="danger"
                className="w-full p-2 "
              >
                <LogOut size={18} />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </aside>

      <Modal
        open={confrim}
        title="Confirm Logout"
        message="Are you sure you want to logout?"
        onClose={() => setConfrim(false)}
        buttons={
          <>
            <Button
              onClick={() => setConfrim(false)}
              variant="outline"
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              variant="danger"
              loading={isLoading}
              disabled={isLoading}
              onClick={handleLogout}
            >
              Confirm
            </Button>
          </>
        }
      />
    </>
  );
}
