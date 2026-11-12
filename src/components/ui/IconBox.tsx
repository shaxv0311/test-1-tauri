export default function IconBox({
  icon,
  className,
}: {
  icon?: React.ReactNode;
  className?: string;
}) {
  return <div className={`icon-box ${className || ""}`}>{icon}</div>;
}
