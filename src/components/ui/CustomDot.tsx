const colorClassMap: Record<string, string> = {
  green: "custom-dot-green",
  blue: "custom-dot-blue",
  red: "custom-dot-red",
  orange: "custom-dot-orange",
  gray: "custom-dot-gray",
  primary: "custom-dot-blue",
};

const CustomDot = ({
  color = "gray",
  className = "",
}: {
  color?: string;
  className?: string;
}) => {
  const isHex =
    color?.startsWith("#") || color?.startsWith("[") || color === "#C4C7CC";
  const colorClass = isHex ? "" : colorClassMap[color] || "custom-dot-gray";

  return (
    <div
      className={`custom-dot ${colorClass} ${className}`}
      style={
        color?.startsWith("#")
          ? { background: color }
          : color?.startsWith("[")
            ? { background: `#${color.replace(/[[\]]/g, "")}` }
            : undefined
      }
    ></div>
  );
};

export default CustomDot;
