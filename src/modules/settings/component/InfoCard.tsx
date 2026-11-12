import IconBox from "../../../components/ui/IconBox";

interface InfoCardProps {
  icon?: React.ReactNode;
  label: string;
  value: string;
  description: string;
  color?: string;
  iconClass?: string;
}

export function InfoCard({
  icon,
  label,
  value,
  description,
  iconClass = "",
}: InfoCardProps) {
  return (
    <div className="info-card-row">
      <IconBox icon={icon} className={`info-card-icon ${iconClass}`} />

      <div className="info-card-body">
        <p className="info-card-label">{label}</p>

        <p className="info-card-value">{value}</p>

        <p className="info-card-desc">{description}</p>
      </div>
    </div>
  );
}
