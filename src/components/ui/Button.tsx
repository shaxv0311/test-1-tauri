import { Loader2 } from "lucide-react";
import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | "primary"
    | "secondary"
    | "warning"
    | "success"
    | "danger"
    | "outline"
    | "others";
  loading?: boolean;
  children: React.ReactNode;
}

const variantClasses: Record<string, string> = {
  primary: "btn-primary",
  secondary: "btn-secondary",
  warning: "btn-warning",
  success: "btn-success",
  danger: "btn-danger",
  outline: "btn-outline",
  others: "btn-others",
};

const Button = ({
  variant = "primary",
  loading = false,
  className = "",
  children,
  disabled,
  ...props
}: ButtonProps) => {
  return (
    <button
      className={[
        "btn",
        variantClasses[variant] || "btn-primary",
        disabled || loading ? "disabled-opacity-60 disabled-cursor-not-allowed" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 size={16} className="animate-spin" />}
      {children}
    </button>
  );
};

export default Button;
