export default function DashboardCard({ data }: any) {
  // const Icon = data.icon;

  return (
    <div className="dashboard-card">
      <div
        className="dashboard-card-icon"
        style={{
          backgroundColor: `${data.color}15`,
        }}
      >
        {/* <Icon
          size={24}
          strokeWidth={1.5}
          style={{
            color: data.color,
          }}
        /> */}
      </div>

      <div className="dashboard-card-body">
        <p className="dashboard-card-label truncate">{data.title}</p>

        <p className="dashboard-card-value">{data.value}</p>
      </div>
    </div>
  );
}
