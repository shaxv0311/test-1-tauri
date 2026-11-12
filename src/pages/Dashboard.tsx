// import { TbReceipt, TbUsers, TbTrendingDown, TbTrendingUp } from "react-icons/tb";
import { useNavigate } from "react-router-dom";
import Button from "../components/ui/Button";
import DashboardCard from "../components/ui/DashboardCard";
import Table from "../components/table/Table";
import TableHeader from "../components/table/TableHeader";
import TableRow from "../components/table/TableRow";
import TableCell from "../components/table/TableCell";
import NoData from "../components/table/noData";
import CircleLoader from "../components/ui/CircleLoader";
import StatusCard from "../components/ui/StatusCard";
import { ROUTES } from "../router/routes";
import { useGetDashboardQuery } from "../api/featutres/dashboardFeatures/dashboardApi";
import ExpiringSoonTable from "../components/dashbord/ExpiringSoonTable";
import TestNativeNotification from "../services/TestNativeNotification";
import AudioRecorder from "../services/microphone/AudioRecorder";
import CameraPreview from "./CameraPreview";

const formatCurrency = (value: any) => {
  const amount = Number(value || 0);
  return (
    "₹" +
    amount.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
};

const outOfStockHeader = [
  { label: "Product" },
  { label: "Category" },
  { label: "Brand" },
  { label: "HSN Code" },
  { label: "Buy Price", className: "text-right" },
  { label: "Sell Price", className: "text-right" },
  { label: "Stock", className: "text-center" },
] as any;

export default function Dashboard() {
  const navigate = useNavigate();
  const { data, isLoading } = useGetDashboardQuery();

  const expiring3 = data?.expiring_products?.three_months || {
    count: 0,
    items: [],
  };
  const expiring6 = data?.expiring_products?.six_months || {
    count: 0,
    items: [],
  };
  const outOfStock = data?.out_of_stock || { count: 0, items: [] };

  const DASHBOARD_DATA = [
    {
      title: "Today's Income",
      value: formatCurrency(data?.today_total_income),
      // icon: TbTrendingUp,
      color: "#09b328",
    },
    {
      title: "Today's Expense",
      value: formatCurrency(data?.today_total_expense),
      // icon: TbTrendingDown,
      color: "#eb1501",
    },
    {
      title: "Bills Today",
      value: data?.today_total_bill_count || 0,
      // icon: TbReceipt,
      color: "#247ceb",
    },
    {
      title: "Total Suppliers",
      value: data?.total_supplier || 0,
      // icon: TbUsers,
      color: "#f59e0b",
    },
  ];

  return (
    <div className="dashboard-page">
      {isLoading ? (
        <CircleLoader />
      ) : (
        <>
          <div className="dashboard-stats-grid">
            {DASHBOARD_DATA.map((item) => (
              <DashboardCard key={item.title} data={item} />
            ))}
          </div>
          <AudioRecorder />
          <TestNativeNotification />
          <CameraPreview />
          <div className="dashboard-alerts-grid">
            <div className="dashboard-alert-card dashboard-alert-red">
              <div>
                <p className="dashboard-alert-label">Expiring in 3 Months</p>
                <p className="dashboard-alert-value">{expiring3.count}</p>
              </div>
              <Button
                variant="secondary"
                onClick={() =>
                  navigate(`${ROUTES.INVENTORY.EXPIRING_BATCHES}?type=3_months`)
                }
              >
                View
              </Button>
            </div>
            <div className="dashboard-alert-card dashboard-alert-orange">
              <div>
                <p className="dashboard-alert-label">Expiring in 6 Months</p>
                <p className="dashboard-alert-value">{expiring6.count}</p>
              </div>
              <Button
                variant="secondary"
                onClick={() =>
                  navigate(`${ROUTES.INVENTORY.EXPIRING_BATCHES}?type=6_months`)
                }
              >
                View
              </Button>
            </div>
            <div className="dashboard-alert-card dashboard-alert-blue">
              <div>
                <p className="dashboard-alert-label">Out of Stock</p>
                <p className="dashboard-alert-value">{outOfStock.count}</p>
              </div>
              <Button
                variant="secondary"
                onClick={() => navigate(ROUTES.INVENTORY.PRODUCTS)}
              >
                View
              </Button>
            </div>
          </div>

          <ExpiringSoonTable
            title="Expiring Soon (Next 3 Months)"
            items={expiring3.items}
            filterType="3_months"
          />

          <ExpiringSoonTable
            title="Expiring Soon (Next 6 Months)"
            items={expiring6.items}
            filterType="6_months"
          />

          <div className="dashboard-panel dashboard-panel-full">
            <div className="dashboard-panel-header">
              <h2 className="dashboard-panel-title">Out of Stock Products</h2>
              <Button
                variant="secondary"
                onClick={() => navigate(ROUTES.INVENTORY.PRODUCTS)}
              >
                View All
              </Button>
            </div>
            <Table>
              <TableHeader headerItems={outOfStockHeader} />
              <tbody>
                {outOfStock.items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={outOfStockHeader.length}>
                      <NoData
                        message="No data available"
                        className="border-none"
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  outOfStock.items.map((item: any) => (
                    <TableRow key={item.productId}>
                      <TableCell>
                        <span className="text-txt1 font-bold">
                          {item.productName}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-txt3">
                          {item.categoryName || "-"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span>{item.brandName || "-"}</span>
                      </TableCell>
                      <TableCell>
                        <span>{item.hsnCode || "-"}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span>₹{item.buyPrice}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span>₹{item.sellPrice}</span>
                      </TableCell>
                      <TableCell className="text-center">
                        <StatusCard status="Out of Stock" color="red" />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </tbody>
            </Table>
          </div>
        </>
      )}
    </div>
  );
}
