import type { StylesConfig } from "react-select";

const SELECT_MENU_PORTAL_ID = "app-select-menu-portal";

const COLORS = {
  primary: "#247ceb",
  primaryLight: "rgba(36, 124, 235, 0.08)",
  primaryFocus: "#247CEB4D",

  green: "#09B328",
  orange: "#F59E0B",
  red: "#EB1501",

  background: "#F8FAFC",
  border: "#E3E9F0",

  txt1: "#363C48",
  txt2: "#656E7B",
  txt3: "#64748B",

  white: "#ffffff",
};

/**
 * react-select positions its menu absolutely inside the control, so any
 * scrolling/clipping ancestor (modal body, form scroll area) cuts the open
 * list off. Rendering it in a portal at the document root avoids that.
 */
let selectMenuPortal: HTMLElement | null = null;

export const selectMenuPortalTarget = (): HTMLElement => {
  if (!selectMenuPortal) {
    selectMenuPortal = document.createElement("div");
    selectMenuPortal.id = SELECT_MENU_PORTAL_ID;
    document.body.appendChild(selectMenuPortal);
  }
  return selectMenuPortal;
};

export const asyncPaginateStyle = (
  hasError = false,
): StylesConfig<any, false> => ({
  control: (base, state) => ({
    ...base,
    width: "100%",
    minWidth: 0,
    minHeight: "40px",
    height: "40px",
    borderRadius: "0.5rem",
    fontSize: "12px",
    backgroundColor: COLORS.background,
    borderColor: hasError
      ? COLORS.red
      : state.isFocused
        ? COLORS.primary
        : COLORS.border,
    boxShadow: "none",

    "&:hover": {
      borderColor: hasError ? COLORS.red : COLORS.primary,
    },
  }),

  valueContainer: (base) => ({
    ...base,
    minWidth: 0,
    overflow: "hidden",
  }),

  singleValue: (base) => ({
    ...base,
    maxWidth: "100%",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  }),

  placeholder: (base) => ({
    ...base,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  }),

  input: (base) => ({
    ...base,
    minWidth: 0,
  }),

  indicatorsContainer: (base) => ({
    ...base,
    flexShrink: 0,
  }),

  dropdownIndicator: (base, state) => ({
    ...base,
    transition: "transform 0.2s ease",
    transform: state.selectProps.menuIsOpen ? "rotate(180deg)" : "rotate(0deg)",
  }),

  indicatorSeparator: () => ({
    display: "none",
  }),

  option: (base, state) => ({
    ...base,
    cursor: "pointer",
    backgroundColor: state.isSelected
      ? COLORS.primary
      : state.isFocused
        ? COLORS.primaryFocus
        : COLORS.background,
    color: state.isSelected ? COLORS.white : COLORS.txt1,

    "&:active": {
      backgroundColor: COLORS.primaryLight,
    },
  }),

  menu: (base) => ({
    ...base,
    zIndex: 99999,
    fontSize: "12px",
  }),

  // Portaled menus are fixed-positioned against the viewport, so they must sit
  // above the modal overlay (z-index 50) instead of relying on ancestor stacking.
  menuPortal: (base) => ({
    ...base,
    zIndex: 99999,
  }),

  menuList: (base) => ({
    ...base,
    maxHeight: 220,
    overflowY: "auto",
    overflowX: "hidden",
  }),
});
