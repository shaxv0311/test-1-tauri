import { Star } from "lucide-react";
import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  labelClassName?: string;
  isRequired?: boolean;
  // startContent?: String;
  disabled?: boolean;
  isEditable?: boolean;
  icon?: React.ReactNode;
  ref?: React.Ref<HTMLInputElement>;
  labelIcon?: React.ReactNode;
}

const Input: React.FC<InputProps> = ({
  label,
  ref,
  error,
  className = "",
  labelClassName = "",
  isRequired = false,
  icon,
  labelIcon,
  ...props
}) => {
  return (
    <div className="form-field">
      {(label || labelIcon) && (
        <div className="form-label-row">
          {labelIcon && labelIcon}
          {label && (
            <label
              htmlFor={props?.name}
              className={`form-label ${labelClassName}`}
            >
              {label}
              {isRequired && <Star stroke="red" size={6} fill="red" />}
            </label>
          )}
        </div>
      )}

      <div className="form-input-wrap">
        {icon && <span className="form-input-icon">{icon}</span>}

        <input
          {...props}
          ref={ref}
          onWheel={(e) => e.currentTarget.blur()}
          onFocus={(e) => {
            // Default 0 values would otherwise read as "0500" when the user
            // types — selecting the existing text replaces it instead.
            if (e.target.type === "number" && e.target.value !== "") {
              e.target.select();
            }
            props.onFocus?.(e);
          }}
          style={icon ? { paddingLeft: `${2.2 * 10 + 12}px` } : undefined}
          className={[
            "form-input",
            icon ? "form-input-with-icon" : "",
            error ? "form-input-error" : "",
            props.disabled ? "cursor-not-allowed opacity-90" : "",
            className,
          ]
            .filter(Boolean)
            .join(" ")}
        />
      </div>

      {error && <span className="form-error">{error}</span>}
    </div>
  );
};

export default Input;
