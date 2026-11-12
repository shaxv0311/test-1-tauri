import { Star } from "lucide-react";
import React from "react";

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  isRequired?: boolean;
  extraContainerStyle?: string;
}

const Textarea: React.FC<TextareaProps> = ({
  label,
  error,
  className = "",
  isRequired = false,
  extraContainerStyle = "",
  ...props
}) => {
  return (
    <div className={`form-field ${extraContainerStyle}`}>
      {label && (
        <label htmlFor={props?.name} className="form-label">
          {label}
          {isRequired && <Star stroke="red" size={8} fill="red" />}
        </label>
      )}

      <textarea
        {...props}
        className={[
          "form-textarea",
          error ? "form-textarea-error" : "",
          props.disabled ? "cursor-not-allowed opacity-90" : "",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
      />

      {error && <span className="form-error">{error}</span>}
    </div>
  );
};

export default Textarea;
