// import { FaCircleCheck } from "react-icons/fa6";
import ToggleButton from "./ToggleButton";

export default function StatusToggleCard({
  noIcon = true,
  titile,
  description,
  value,
  onChange,
  children,
}: {
  noIcon?: boolean;
  titile: string;
  description: string;
  value: boolean;
  onChange?: (checked: boolean) => void;
  children?: React.ReactNode;
}) {
  return (
    <div className="status-toggle-card">
      <div className="status-toggle-row">
        <div className="status-toggle-left">
          {/* Status Icon */}
          {noIcon && (
            <div
              className={`status-toggle-icon ${value ? "status-toggle-icon-on" : ""}`}
            >
              {/* <FaCircleCheck
                size={17}
                className={value ? "text-green" : "text-gray-400"}
              /> */}
            </div>
          )}

          <div className="status-toggle-text">
            <p className="status-toggle-title">{titile}</p>

            <p className="status-toggle-desc">{description}</p>
          </div>
        </div>

        <ToggleButton data={value} htmlFor="status" onChange={onChange} />
      </div>

      {children}
    </div>
  );
}
