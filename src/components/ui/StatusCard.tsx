interface StatusCardProps {
  status: string;
  color?: string;
  isShow?: boolean;
  isRightShow?: boolean;
  className?: string;
}

const colorStyles: Record<string, { style: string; dot: string }> = {
  green: {
    style: "status-card-inner status-card-green",
    dot: "status-dot status-dot-green",
  },
  blue: {
    style: "status-card-inner status-card-blue",
    dot: "status-dot status-dot-blue",
  },
  red: {
    style: "status-card-inner status-card-red",
    dot: "status-dot status-dot-red",
  },
  orange: {
    style: "status-card-inner status-card-orange",
    dot: "status-dot status-dot-orange",
  },
  gray: {
    style: "status-card-inner status-card-gray",
    dot: "status-dot status-dot-gray",
  },
  purple: {
    style: "status-card-inner status-card-purple",
    dot: "status-dot status-dot-purple",
  },
};

const StatusCard = ({
  status,
  color = "gray",
  isShow = false,
  isRightShow = false,
  className = "",
}: StatusCardProps) => {
  const selectedColor = colorStyles[color] || colorStyles.gray;

  return (
    <div className="status-card">
      <div
        className={`${selectedColor.style} ${className}`}
      >
        {isShow && <span className={selectedColor.dot} />}

        <span className="capitalize">{status}</span>

        {isRightShow && <span className={selectedColor.dot} />}
      </div>
    </div>
  );
};

export default StatusCard;
