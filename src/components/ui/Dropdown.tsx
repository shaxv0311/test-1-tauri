import { Star, ChevronDown } from "lucide-react";
import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

type DropdownOption =
  | string
  | number
  | {
      label: string;
      value: string | number;
    };

interface DropdownProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  isRequired?: boolean;
  options?: DropdownOption[];
  placeholder?: string;
  labelClassName?: string;
}

const DROPDOWN_PORTAL_ID = "app-dropdown-portal";
const LIST_MAX_HEIGHT = 240;
const GAP = 4;

const formatLabel = (value: string | number) => {
  return String(value)
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

/** Shared root so every portaled list stacks in one place. */
const getDropdownPortal = (): HTMLElement | null => {
  if (typeof document === "undefined") return null;
  let node = document.getElementById(DROPDOWN_PORTAL_ID);
  if (!node) {
    node = document.createElement("div");
    node.id = DROPDOWN_PORTAL_ID;
    document.body.appendChild(node);
  }
  return node;
};

const Dropdown = ({
  label,
  error,
  isRequired = false,
  options = [],
  placeholder,
  className = "",
  labelClassName = "",
  onChange,
  value,
  defaultValue,
  disabled,
  id,
  name,
  onBlur,
  ...props
}: DropdownProps) => {
  const initialValue = value ?? defaultValue ?? "";
  const [selectedValue, setSelectedValue] = useState(String(initialValue));
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  // The list is portaled to <body>, so it can't be closed by the click-outside
  // check on dropdownRef — the list is a separate DOM subtree.
  const [listStyle, setListStyle] = useState<React.CSSProperties | null>(null);

  useEffect(() => {
    if (value !== undefined) setSelectedValue(String(value));
  }, [value]);

  useEffect(() => {
    if (!isOpen) setListStyle(null);
  }, [isOpen]);

  const positionList = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    // Flip above the trigger when there isn't room below, so the list is never
    // pushed off-screen by a dropdown near the bottom of a modal.
    const openUpwards = spaceBelow < LIST_MAX_HEIGHT + GAP && spaceAbove > spaceBelow;
    const maxHeight = Math.max(
      120,
      Math.min(LIST_MAX_HEIGHT, openUpwards ? spaceAbove - GAP : spaceBelow - GAP),
    );

    setListStyle({
      position: "fixed",
      left: rect.left,
      width: rect.width,
      maxHeight,
      [openUpwards ? "bottom" : "top"]: openUpwards
        ? window.innerHeight - rect.top + GAP
        : rect.bottom + GAP,
    });
  }, []);

  useLayoutEffect(() => {
    if (!isOpen) return;

    positionList();

    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        !dropdownRef.current?.contains(target) &&
        !listRef.current?.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    const handleReflow = () => positionList();

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", handleReflow);
    window.addEventListener("scroll", handleReflow, true);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", handleReflow);
      window.removeEventListener("scroll", handleReflow, true);
    };
  }, [isOpen, positionList]);

  const normalizedOptions = options.map((option) => {
    const isObject = typeof option === "object" && option !== null;
    const optionValue = isObject ? option.value : option;
    const optionLabel = isObject
      ? option.label
      : formatLabel(option as string | number);

    return {
      value: String(optionValue),
      label: optionLabel,
    };
  });

  const selectedOption = normalizedOptions.find(
    (option) => option.value === selectedValue,
  );
  const hasValue = selectedValue !== "";

  const selectOption = (optionValue: string) => {
    setSelectedValue(optionValue);
    setIsOpen(false);
    onChange?.({
      target: { name, value: optionValue },
      currentTarget: { name, value: optionValue },
    } as React.ChangeEvent<HTMLSelectElement>);
  };

  return (
    <div className="dropdown-root">
      {label && (
        <label htmlFor={id} className={`dropdown-label ${labelClassName}`}>
          {label}

          {isRequired && <Star stroke="red" size={8} fill="red" />}
        </label>
      )}

      <div ref={dropdownRef} className="dropdown-control">
        <button
          id={id}
          name={name}
          type="button"
          ref={triggerRef}
          disabled={disabled}
          aria-expanded={isOpen}
          onBlur={
            onBlur as unknown as React.FocusEventHandler<HTMLButtonElement>
          }
          onClick={() => setIsOpen((open) => !open)}
          className={[
            "dropdown-trigger",
            !hasValue ? "text-placeholder" : "text-txt1",
            error ? "border-red" : "",
            className,
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <span className="dropdown-value truncate">
            {selectedOption?.label ?? placeholder ?? "Select an option"}
          </span>
          <ChevronDown
            size={18}
            className={`dropdown-caret ${isOpen ? "dropdown-caret-open" : ""}`}
          />
        </button>

        {/* Portaled to <body> so scrolling/clipped ancestors (modal bodies,
            scroll areas) cannot cut the open list off. */}
        {isOpen && listStyle && getDropdownPortal()
          ? createPortal(
              <div
                ref={listRef}
                className="dropdown-list"
                style={listStyle}
              >
                {placeholder && (
                  <button
                    type="button"
                    className="dropdown-option dropdown-option-placeholder"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => selectOption("")}
                  >
                    {placeholder}
                  </button>
                )}
                {normalizedOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={`dropdown-option ${
                      option.value === selectedValue
                        ? "dropdown-option-active"
                        : ""
                    }`}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => selectOption(option.value)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>,
              getDropdownPortal() as HTMLElement,
            )
          : null}
      </div>

      {error && <p className="form-error">{error}</p>}
    </div>
  );
};

export default Dropdown;
