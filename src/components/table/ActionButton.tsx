import React from "react";

interface ActionButtonProps {
  icon: React.ElementType;
  onClick?: () => void;
  color?: "primary" | "green" | "red" | "orange" | "blue";
  text?: string;
}

const colorClasses: Record<string, string> = {
  primary: "action-btn-primary",
  green: "action-btn-green",
  red: "action-btn-red",
  orange: "action-btn-orange",
  blue: "action-btn-blue",
};

const textColorClasses: Record<string, string> = {
  primary: "text-primary",
  green: "text-green",
  red: "text-red",
  orange: "text-orange",
  blue: "text-primary",
};

export default function ActionButton({
  icon: Icon,
  onClick,
  color = "primary",
  text,
}: ActionButtonProps) {
  return (
    <div className="action-btn-wrap">
      <button
        type="button"
        onClick={onClick}
        className={[
          "action-btn",
          text
            ? textColorClasses[color] || "text-primary"
            : colorClasses[color] || "action-btn-primary",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <Icon size={15} strokeWidth={2} />
        {text && <span>{text}</span>}
      </button>
    </div>
  );
}
