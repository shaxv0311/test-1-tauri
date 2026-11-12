import { useState } from "react";
import { ChevronDown } from "lucide-react";

const optionDotClass: Record<string, string> = {
  Ongoing: "status-dropdown-dot-blue",
  Pending: "status-dropdown-dot-yellow",
  Completed: "status-dropdown-dot-green",
};

export default function StatusDropdown() {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState("Ongoing");

  const options = ["Ongoing", "Pending"];

  return (
    <div className="status-dropdown status-dropdown-bordered">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="status-dropdown-btn status-dropdown-btn-blue"
      >
        <span
          className={`status-dropdown-dot ${
            optionDotClass[status] || "status-dropdown-dot-blue"
          }`}
        />

        <span className="status-dropdown-btn-text">{status}</span>

        <ChevronDown
          size={18}
          className={`status-dropdown-caret ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="status-dropdown-menu status-dropdown-menu-full">
          {options.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => {
                setStatus(option);
                setOpen(false);
              }}
              className="status-dropdown-item status-dropdown-item-row"
            >
              <span
                className={`status-dropdown-dot ${
                  optionDotClass[option] || "status-dropdown-dot-blue"
                }`}
              />
              <span>{option}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
