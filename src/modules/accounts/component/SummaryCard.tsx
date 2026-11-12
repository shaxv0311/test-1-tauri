import IconBox from "../../../components/ui/IconBox";

const toneClass: Record<string, string> = {
  green: "summary-tone-green",
  red: "summary-tone-red",
  primary: "summary-tone-primary",
};

export const SummaryCard = ({
  title,
  amount,
  color,
  icon,
  sign,
}: {
  title: string;
  amount: number;
  color: string;
  icon?: React.ReactNode;
  sign?: string;
}) => {
  const tone = toneClass[color] || "summary-tone-primary";

  return (
    <div className="summary-card">
      <IconBox icon={icon} className={`summary-card-icon ${tone}`} />

      <div className="summary-card-body">
        <span className="summary-card-label">{title}</span>

        <span className={`summary-card-amount ${tone}`}>
          {sign} ₹
          {(amount ?? 0).toLocaleString("en-IN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </span>
      </div>
    </div>
  );
};
