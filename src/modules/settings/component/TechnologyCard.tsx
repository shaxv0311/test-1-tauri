// import { FaCheckCircle } from "/fa";
import IconBox from "../../../components/ui/IconBox";

interface TechnologyCardProps {
  title: string;
  description: string;
  items: string[];
  icon?: React.ReactNode;
  iconClassName?: string;
  color: string;
}

export function TechnologyCard({
  title,
  description,
  items,
  icon,
  iconClassName,
  color,
}: TechnologyCardProps) {
  return (
    <div className="technology-card">
      <div className="technology-card-top">
        <div className="technology-card-heading">
          <IconBox icon={icon} className={iconClassName} />
          <h4 className="technology-card-title">{title}</h4>
        </div>

        <p className="technology-card-desc">{description}</p>
      </div>

      <div className="technology-card-divider" />

      <div className="technology-card-items">
        {items.map((item, index) => (
          <div className="technology-card-item" key={index}>
            {/* <FaCheckCircle size={15} color={color} /> */}

            <p className="technology-card-item-text">{item}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
