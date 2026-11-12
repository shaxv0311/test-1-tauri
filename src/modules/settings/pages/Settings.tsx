import {
  ArrowRightLeft,
  AtSign,
  Edit,
  Globe,
  LockKeyhole,
  LogOut,
  ReceiptIndianRupee,
  Store,
  UserPlus,
  X,
} from "lucide-react";
import { TechnologyCard } from "../component/TechnologyCard";
import { InfoCard } from "../component/InfoCard";
import { BsFillCheckCircleFill, BsPatchCheckFill } from "react-icons/bs";
import StatusToggleCard from "../../../components/ui/StatusToggleCard";
import Button from "../../../components/ui/Button";
// import { FaHeart, FaIdCard, FaPhoneAlt, FaUserFriends } from "react-icons/fa";
// import { MdOutlinePhoneInTalk } from "react-icons/md";
// import { FaBoxArchive, FaLocationDot } from "react-icons/fa6";

import logo from "../../../../src/assets/logo_settings.png";
// import {
//   IoBag,
//   IoCalculatorSharp,
//   IoLocation,
//   IoMail,
//   IoSparklesSharp,
// } from "react-icons/io5";
// import { CgWebsite } from "react-icons/cg";
// import { RiGitBranchFill } from "react-icons/ri";
// import { TbReceiptFilled, TbReload } from "react-icons/tb";
// import { HiCog6Tooth } from "react-icons/hi2";
// import { IoIosSchool } from "react-icons/io";
// import { PiPlusFill } from "react-icons/pi";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import Modal from "../../../components/ui/Modal";
import EditStore from "../component/EditStore";
import ResetPasswordModal from "../component/ResetPasswordModal";
import IconBox from "../../../components/ui/IconBox";
import Input from "../../../components/ui/Input";
import {
  useGetShopQuery,
  useUpdateShopMutation,
} from "../../../api/featutres/shopFeatures/shopApi";
import {
  useLoginMutation,
  useGetMeQuery,
  useLogoutMutation,
} from "../../../api/featutres/authFeatures/authApi";
import { ROUTES } from "../../../router/routes";
import { setToastMessage } from "../../../helper/helper";

function Badge({
  text,
  icon: Icon,
  href,
}: {
  text: string;
  icon: any;
  href: string;
}) {
  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    const nativeWebView = (
      window as Window & {
        ReactNativeWebView?: { postMessage: (message: string) => void };
      }
    ).ReactNativeWebView;

    if (nativeWebView) {
      event.preventDefault();
      nativeWebView.postMessage(
        JSON.stringify({ type: "open-url", url: href }),
      );
      return;
    }

    if (href.startsWith("http")) {
      event.preventDefault();
      window.open(href, "_blank", "noopener,noreferrer");
      return;
    }

    if (typeof window !== "undefined") {
      window.location.href = href;
    }
  };

  return (
    <a href={href} onClick={handleClick} className="settings-badge">
      <Icon size={16} strokeWidth={1.5} className="settings-badge-icon" />
      {text}
    </a>
  );
}

const SOFTWARE = [
  {
    name: "CRM Software",
    // icon: FaUserFriends,
  },
  {
    name: "ERP Software",
    // icon: RiGitBranchFill,
  },
  {
    name: "Accounting Software",
    // icon: IoCalculatorSharp,
  },
  {
    name: "E-Commerce Software",
    // icon: IoBag,
  },
  {
    name: "Billing Software",
    // icon: TbReceiptFilled,
  },
  {
    name: "Matrimony Software",
    // icon: FaHeart,
  },
  {
    name: "School & College EMS",
    // icon: IoIosSchool,
  },
  {
    name: "Inventory & POS Software",
    // icon: FaBoxArchive,
  },
  {
    name: "HRM & Payroll Systems",
    // icon: FaIdCard,
  },
  {
    name: "Hospital Management",
    // icon: PiPlusFill,
  },
  {
    name: "Custom Enterprise Workflows",
    // icon: HiCog6Tooth,
  },
];

export default function Settings() {
  const [isOpen, setIsOpen] = useState(false);
  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false);

  const { data: shopdata, refetch: refetchShop } = useGetShopQuery({
    gst: true,
  });
  const [updateShop] = useUpdateShopMutation();
  const [isGstSaving, setIsGstSaving] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isLogoUploading, setIsLogoUploading] = useState(false);

  const [login] = useLoginMutation();
  const [logout, { isLoading: isLoggingOut }] = useLogoutMutation();
  const { data: meData } = useGetMeQuery();
  const [isLinkOpen, setIsLinkOpen] = useState(false);
  const [linkEmail, setLinkEmail] = useState("");
  const [linkPassword, setLinkPassword] = useState("");
  const [isLinking, setIsLinking] = useState(false);
  const [isSwitchOpen, setIsSwitchOpen] = useState(false);
  const [isConfirmLogout, setIsConfirmLogout] = useState(false);
  const [linkedAccounts, setLinkedAccounts] = useState<
    { email: string; token: string }[]
  >(() => {
    try {
      return JSON.parse(localStorage.getItem("linked_accounts") || "[]");
    } catch {
      return [];
    }
  });

  const ensureCurrentAccount = (list: { email: string; token: string }[]) => {
    const token = localStorage.getItem("auth_token");
    const email =
      meData?.data?.user?.email || meData?.user?.email || meData?.email;
    if (token && email && !list.some((a) => a.email === email)) {
      list.push({ email, token });
    }
    return list;
  };
  const persistAccounts = (list: { email: string; token: string }[]) => {
    localStorage.setItem("linked_accounts", JSON.stringify(list));
    setLinkedAccounts(list);
  };

  const handleStoreLogoChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setToastMessage("error", "Please select a valid image file.");
      event.target.value = "";
      return;
    }

    const MAX_FILE_SIZE = 20 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      setToastMessage("error", "Image size should be less than 20 MB.");
      event.target.value = "";
      return;
    }

    const shop = shopdata?.shop;
    if (!shop) return;

    setLogoPreview(URL.createObjectURL(file));
    setIsLogoUploading(true);

    try {
      const formData = new FormData();
      formData.append("shop_name", shop.shop_name || "");
      formData.append("phone", shop.phone || "");
      formData.append("email", shop.email || "");
      formData.append("address", shop.address || "");
      formData.append("gstin", shop.gstin || "");
      formData.append("gst", String(Boolean(shop.gst)));
      formData.append("logo", file);

      const res: any = await updateShop(formData).unwrap();

      if (res?.success) {
        setToastMessage("success", "Store image updated");
      }
    } catch (error: any) {
      if (error?.status === 401) return;
      setToastMessage(
        "error",
        error?.data?.message || "Failed to update store image",
      );
      setLogoPreview(null);
    } finally {
      setIsLogoUploading(false);
      event.target.value = "";
    }
  };

  /**
   * GST is a shop-level master switch — billing screens (invoice/bill, etc.)
   * only expose their GST controls when this is on, so it has to be persisted
   * on the shop row. The endpoint requires shop_name, so resend the current
   * values and change only the flag. `logo` is deliberately omitted so the
   * backend keeps the existing file.
   */
  const handleToggleGst = async (checked: boolean) => {
    const shop = shopdata?.shop;
    if (!shop || isGstSaving) return;

    setIsGstSaving(true);
    try {
      const formData = new FormData();
      formData.append("shop_name", shop.shop_name || "");
      formData.append("phone", shop.phone || "");
      formData.append("email", shop.email || "");
      formData.append("address", shop.address || "");
      formData.append("gstin", shop.gstin || "");
      formData.append("gst", String(checked));

      const res: any = await updateShop(formData).unwrap();

      if (res?.success) {
        setToastMessage(
          "success",
          `GST calculation ${checked ? "enabled" : "disabled"}`,
        );
      }
    } catch (error: any) {
      if (error?.status === 401) return;
      setToastMessage(
        "error",
        error?.data?.message || "Failed to update GST setting",
      );
    } finally {
      setIsGstSaving(false);
    }
  };

  const handleLinkSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!linkEmail || !linkPassword) return;
    setIsLinking(true);
    try {
      const response: any = await login({
        email: linkEmail,
        password: linkPassword,
      }).unwrap();
      const token = response?.data?.token || response?.token;
      const user = response?.data?.user || response?.user;
      const email = user?.email || linkEmail;

      let list = ensureCurrentAccount([...linkedAccounts]);
      const idx = list.findIndex((a) => a.email === email);
      if (idx >= 0) {
        if (token) list[idx].token = token;
      } else if (token) {
        list.push({ email, token });
      }
      persistAccounts(list);
      setToastMessage("success", "Account linked successfully");
      setLinkEmail("");
      setLinkPassword("");
      setIsLinkOpen(false);
    } catch (err: any) {
      if (err?.status === 401) return;
      setToastMessage("error", err?.data?.message || "Invalid credentials");
    } finally {
      setIsLinking(false);
    }
  };

  const handleSwitchAccount = (account: { email: string; token: string }) => {
    localStorage.setItem("auth_token", account.token);
    window.location.reload();
  };
  const handleRemoveAccount = (email: string) => {
    const list = linkedAccounts.filter((a) => a.email !== email);
    persistAccounts(list);
  };

  const handleLogout = async () => {
    try {
      await logout().unwrap();
    } catch {
      // proceed regardless — token is cleared below
    } finally {
      localStorage.clear();
      setToastMessage("success", "Logout successful");
      setIsConfirmLogout(false);
      window.location.hash = ROUTES.LOGIN;
    }
  };

  return (
    <div className="settings-page">
      {shopdata?.shop ? (
        <>
          <div className="settings-store-grid">
            <div className="settings-store-profile">
              {/* ── Logged-in user row ── */}
              {(() => {
                const currentEmail =
                  meData?.data?.user?.email ||
                  meData?.user?.email ||
                  meData?.email ||
                  "";
                const currentName =
                  meData?.data?.user?.name ||
                  meData?.user?.name ||
                  meData?.name ||
                  "";
                const currentRole =
                  meData?.data?.user?.role ||
                  meData?.user?.role ||
                  meData?.role ||
                  "";
                const initials = currentName
                  ? currentName
                      .split(" ")
                      .map((w: string) => w[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2)
                  : currentEmail
                    ? currentEmail[0].toUpperCase()
                    : "U";
                return (
                  <div className="settings-user-row">
                    <div className="settings-user-avatar">{initials}</div>
                    <div className="settings-user-info">
                      {currentName && (
                        <p className="settings-user-name">{currentName}</p>
                      )}
                      <p className="settings-user-email">
                        {currentEmail || "Not signed in"}
                      </p>
                    </div>
                    <div className="settings-user-badges">
                      <span className="settings-user-badge settings-user-badge--active">
                        Logged In
                      </span>
                      {currentRole && (
                        <span className="settings-user-badge settings-user-badge--role">
                          {currentRole}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })()}

              <div className="settings-user-divider" />

              {/* ── Store logo / name row ── */}
              <div className="settings-store-logo-row">
                <div className="settings-store-logo-thumb">
                  {logoPreview ? (
                    <img src={logoPreview} alt="Store logo preview" />
                  ) : shopdata?.shop?.logo ? (
                    <img
                      src={`${import.meta.env.VITE_APP_USER_IMAGE_URL}${shopdata.shop.logo}`}
                      alt={shopdata.shop.shop_name || "Store logo"}
                    />
                  ) : (
                    <div className="settings-store-logo-placeholder">
                      <Store size={18} />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="settings-store-name">
                    {shopdata?.shop?.shop_name || "Store Name"}
                  </h3>
                  <p className="settings-store-meta">
                    Store Email: {shopdata?.shop?.email || "Not set"}
                  </p>
                </div>

                <button
                  type="button"
                  className="settings-store-logo-upload-btn"
                  title="Refresh shop details"
                  onClick={() => refetchShop()}
                >
                  {/* <TbReload size={15} /> */}
                </button>

                <button
                  type="button"
                  className="settings-switch-btn"
                  title="Switch account"
                  onClick={() => {
                    const list = ensureCurrentAccount([...linkedAccounts]);
                    persistAccounts(list);
                    setIsSwitchOpen(true);
                  }}
                >
                  <ArrowRightLeft size={15} />
                  Switch
                </button>
              </div>

              <Button
                className="settings-edit-btn-small"
                onClick={() => setIsOpen(true)}
              >
                <Edit size={13} />
                Edit
              </Button>
            </div>

            <div className="settings-gst-card">
              <StatusToggleCard
                noIcon={false}
                titile="Show GST Calculation"
                description="When enabled, adds GST percentage to invoice bills . When disabled, GST is hidden ."
                value={Boolean(shopdata?.shop?.gst)}
                onChange={handleToggleGst}
              >
                {shopdata?.shop?.gst && (
                  <div className="settings-toggle-note">
                    GST will be shown on bills
                  </div>
                )}
              </StatusToggleCard>
            </div>
          </div>

          <div className="settings-info-grid">
            <InfoCard
              // icon={<MdOutlinePhoneInTalk size={24} />}
              label="PHONE NUMBER"
              value={shopdata?.shop?.phone || "Not set"}
              description="Primary support & billing phone"
              iconClass="info-icon-primary"
            />

            <InfoCard
              icon={<AtSign size={24} />}
              label="EMAIL ADDRESS"
              value={shopdata?.shop?.email || "Not set"}
              description="Official business correspondence"
              iconClass="info-icon-indigo"
            />

            <InfoCard
              icon={<ReceiptIndianRupee size={24} />}
              label="GSTIN NUMBER"
              value={shopdata.shop?.gstin || "Not set"}
              description="GSTIN number of the business"
              iconClass="info-icon-green"
            />

            <InfoCard
              // icon={<FaLocationDot size={22} />}
              label="STORE ADDRESS"
              value={shopdata?.shop?.address || "Not set"}
              description="Official showroom & billing location"
              iconClass="info-icon-orange"
            />
          </div>
        </>
      ) : (
        <div className="settings-create-row">
          <Button
            className="settings-create-btn"
            onClick={() => setIsOpen(true)}
          >
            <Store size={20} />
            Create New Store
          </Button>
        </div>
      )}

      <div className="accounts-action-row">
        <div className="link-new-accounts">
          <div className="accounts-action-icon">
            <UserPlus size={18} />
          </div>
          <div className="accounts-action-text">
            <h3>Link New Account</h3>
            <p>Add another account to switch and manage separately</p>
          </div>
          <button onClick={() => setIsLinkOpen(true)}>Link Account</button>
        </div>
        <div className="reset-accounts">
          <div className="accounts-action-icon">
            <LockKeyhole size={18} />
          </div>
          <div className="accounts-action-text">
            <h3>Change Password</h3>
            <p>Update your password to keep your account secure</p>
          </div>
          <button onClick={() => setIsResetPasswordOpen(true)}>
            Reset Password
          </button>
        </div>
        <div className="logout-accounts">
          <div className="accounts-action-icon">
            <LogOut size={18} />
          </div>
          <div className="accounts-action-text">
            <h3>Logout</h3>
            <p>Sign out of this account on this device</p>
          </div>
          <button onClick={() => setIsConfirmLogout(true)}>Logout</button>
        </div>
      </div>

      <div className="settings-company">
        <div className="settings-company-header">
          <div className="settings-company-header-left">
            <img
              src={logo}
              alt="LoopSpring Technologies"
              className="settings-company-logo"
            />

            <div className="settings-company-header-text">
              <h2 className="settings-company-name">
                LoopSpring Technologies & Consultancy Pvt Ltd
              </h2>

              <p className="settings-company-tagline">
                Architecture System Design & Full-Stack Digital Innovation
                Partner
              </p>
            </div>
          </div>
          <div className="settings-company-badges">
            <Badge
              text="www.loopspring.in"
              icon={Globe}
              href="https://www.loopspring.in"
            />
            {/* <Badge
              text="+91 9943653953"
              // icon={FaPhoneAlt}
              href="tel:+919943653953" 
            />*/}
            {/* <Badge
              text="loopspring2@gmail.com"
              icon={IoMail}
              href="mailto:loopspring2@gmail.com"
            /> */}
          </div>
        </div>

        <div>
          <h3 className="settings-tech-heading">
            What we build & core technologies
          </h3>

          <div className="settings-tech-grid">
            <TechnologyCard
              // icon={<CgWebsite />}
              color="#38BDF8"
              iconClassName="technology-card-icon-web"
              title="Website & Web App Development"
              description="Custom high-performance platforms, interactive portals, and scalable cloud applications."
              items={[
                "Full-Stack React & Next.js",
                "Modern Responsive UI/UX",
                "Cloud & Database Scaling",
              ]}
            />

            <TechnologyCard
              color="#A35CFF"
              // icon={<CgWebsite size={15} />}
              iconClassName="technology-card-icon-mobile"
              title="Mobile App Development"
              description="Delightful native & cross-platform iOS and Android mobile software."
              items={[
                "Flutter & Native Apps",
                "High-Speed Offline Cache",
                "App Store Deployment",
              ]}
            />

            <TechnologyCard
              color="#09B328"
              // icon={<CgWebsite />}
              iconClassName="technology-card-icon-desktop"
              title="Desktop Application"
              description="Enterprise cross-platform desktop POS, billing and system software."
              items={[
                "Windows, macOS & Linux",
                "Hardware & Printer POS",
                "Fast Local DB Integration",
              ]}
            />

            <TechnologyCard
              color="#F59E0B"
              // icon={<CgWebsite />}
              iconClassName="technology-card-icon-marketing"
              title="Digital Marketing"
              description="Strategic SEO, targeted marketing campaigns, and data-driven brand acceleration."
              items={[
                "Search Engine Optimization",
                "Brand & Growth Campaigns",
                "Targeted Lead Generation",
              ]}
            />
          </div>
        </div>

        <div className="settings-software-box">
          <div className="settings-software-header">
            {/* <IoSparklesSharp color={"#61CEFF"} size={16} /> */}
            <p className="settings-software-title">
              Specialized Enterprise software suite & custom systems
            </p>
          </div>

          <div className="settings-software-list">
            {SOFTWARE.map((item) => {
              // const Icon = item?.icon;
              return (
                <div key={item.name} className="settings-software-chip">
                  {/* <Icon size={15} strokeWidth={1} /> */}
                  <p>{item.name}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="settings-address">
          {/* <IoLocation size={15} /> */}
          15, ESM Complex, Opp. RTO Office, Kuzhiparivilai, Mulagumoodu (PO),
          Kanniyakumari District. Pin - 629167
        </div>
      </div>
      {isLinkOpen && (
        <div className="edit-store-overlay">
          <div className="edit-store-panel">
            {/* Header */}
            <div className="edit-store-header">
              <div className="edit-store-header-left">
                <div
                  className="edit-store-icon"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <UserPlus size={20} />
                </div>
                <div className="edit-store-title-wrap">
                  <h3 className="edit-store-title">Link New Account</h3>
                  <p className="edit-store-subtitle">
                    Sign in to another account to switch between them instantly
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsLinkOpen(false)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  border: "1px solid #e3e9f0",
                  background: "#f8fafc",
                  cursor: "pointer",
                  color: "#64748b",
                  flexShrink: 0,
                }}
              >
                <X size={16} />
              </button>
            </div>

            <div className="edit-store-divider" />

            {/* Form */}
            <form onSubmit={handleLinkSubmit} className="edit-store-form">
              <Input
                label="Email Address"
                type="email"
                value={linkEmail}
                onChange={(e) => setLinkEmail(e.target.value)}
                placeholder="you@example.com"
              />
              <Input
                label="Password"
                type="password"
                value={linkPassword}
                onChange={(e) => setLinkPassword(e.target.value)}
                placeholder="Enter password"
              />

              {/* Footer */}
              <div className="edit-store-footer" style={{ marginTop: 0 }}>
                <button
                  type="button"
                  className="edit-store-footer-cancel"
                  onClick={() => setIsLinkOpen(false)}
                  style={{
                    padding: "8px 20px",
                    borderRadius: 8,
                    border: "1px solid #e3e9f0",
                    background: "#f8fafc",
                    color: "#363c48",
                    fontWeight: 600,
                    fontSize: 13,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <Button type="submit" loading={isLinking} disabled={isLinking}>
                  <UserPlus size={15} />
                  Link Account
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isSwitchOpen && (
        <div
          className="switch-account-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsSwitchOpen(false);
          }}
        >
          <div className="switch-account-modal">
            {/* Header */}
            <div className="switch-account-header">
              <div className="switch-account-header-icon">
                <ArrowRightLeft size={18} />
              </div>
              <div className="switch-account-header-text">
                <h3 className="switch-account-title">Switch Account</h3>
                <p className="switch-account-subtitle">
                  {linkedAccounts.length} account
                  {linkedAccounts.length !== 1 ? "s" : ""} linked
                </p>
              </div>
              <button
                className="switch-account-close"
                onClick={() => setIsSwitchOpen(false)}
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>

            {/* Account list */}
            <div className="switch-account-list">
              {linkedAccounts.length === 0 ? (
                <div className="switch-account-empty">
                  <div className="switch-account-empty-icon">
                    <ArrowRightLeft size={24} />
                  </div>
                  <p className="switch-account-empty-text">
                    No linked accounts yet
                  </p>
                  <p className="switch-account-empty-hint">
                    Use "Link Account" below to add another account
                  </p>
                </div>
              ) : (
                linkedAccounts.map((acc) => {
                  const currentEmail =
                    meData?.data?.user?.email ||
                    meData?.user?.email ||
                    meData?.email;
                  const isActive =
                    acc.token === localStorage.getItem("auth_token") ||
                    (currentEmail && acc.email === currentEmail);

                  const initials = acc.email ? acc.email[0].toUpperCase() : "?";

                  return (
                    <div
                      key={acc.email}
                      className={`switch-account-item${isActive ? " switch-account-item--active" : ""}`}
                    >
                      {/* Avatar */}
                      <div
                        className={`switch-account-avatar${isActive ? " switch-account-avatar--active" : ""}`}
                      >
                        {initials}
                      </div>

                      {/* Info */}
                      <div className="switch-account-info">
                        <p className="switch-account-email">{acc.email}</p>
                        {isActive && (
                          <span className="switch-account-badge">
                            <BsFillCheckCircleFill size={10} />
                            Currently active
                          </span>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="switch-account-actions">
                        {isActive ? (
                          <span className="switch-account-active-chip">
                            Active
                          </span>
                        ) : (
                          <>
                            <button
                              type="button"
                              className="switch-account-switch-btn"
                              onClick={() => handleSwitchAccount(acc)}
                              title="Switch to this account"
                            >
                              <ArrowRightLeft size={13} />
                              Switch
                            </button>
                            <button
                              type="button"
                              className="switch-account-remove-btn"
                              onClick={() => handleRemoveAccount(acc.email)}
                              title="Remove account"
                            >
                              <Trash2 size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="switch-account-footer">
              <button
                type="button"
                className="switch-account-link-btn"
                onClick={() => {
                  setIsSwitchOpen(false);
                  setIsLinkOpen(true);
                }}
              >
                <UserPlus size={15} />
                Link Another Account
              </button>
              <button
                type="button"
                className="switch-account-cancel-btn"
                onClick={() => setIsSwitchOpen(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <ResetPasswordModal
        isOpen={isResetPasswordOpen}
        onClose={() => setIsResetPasswordOpen(false)}
      />

      <EditStore
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        data={shopdata?.shop}
      />

      <Modal
        open={isConfirmLogout}
        title="Confirm Logout"
        message="Are you sure you want to sign out? You will be redirected to the login page."
        onClose={() => setIsConfirmLogout(false)}
        buttons={
          <>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setIsConfirmLogout(false)}
              disabled={isLoggingOut}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              className="flex-1"
              loading={isLoggingOut}
              disabled={isLoggingOut}
              onClick={handleLogout}
            >
              <LogOut size={16} />
              Confirm Logout
            </Button>
          </>
        }
      />
    </div>
  );
}
