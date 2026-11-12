import { useNavigate } from "react-router-dom";
import Button from "../ui/Button";
import Table from "../table/Table";
import TableHeader from "../table/TableHeader";
import TableRow from "../table/TableRow";
import TableCell from "../table/TableCell";
import NoData from "../table/noData";
import StatusCard from "../ui/StatusCard";
import { ROUTES } from "../../router/routes";

const formatDate = (dateStr: string) => {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getDaysLeft = (expiryDate: string) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);
  return Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
};

const expiringHeader = [
  { label: "Product" },
  { label: "Category" },
  { label: "Brand" },
  { label: "Batch No" },
  { label: "Expiry Date", className: "text-center" },
  { label: "Days Left", className: "text-center" },
  { label: "Quantity", className: "text-center" },
  { label: "MRP", className: "text-right" },
] as any;

type Props = {
  title: string;
  items: any[];
  filterType?: "3_months" | "6_months";
};

export default function ExpiringSoonTable({ title, items, filterType = "3_months" }: Props) {
  const navigate = useNavigate();

  return (
    <div className="dashboard-panel dashboard-panel-full">
      <div className="dashboard-panel-header">
        <h2 className="dashboard-panel-title">{title}</h2>
        <Button
          variant="secondary"
          onClick={() =>
            navigate(`${ROUTES.INVENTORY.EXPIRING_BATCHES}?type=${filterType}`)
          }
        >
          View All
        </Button>
      </div>
      <Table>
        <TableHeader headerItems={expiringHeader} />
        <tbody>
          {items.length === 0 ? (
            <TableRow>
              <TableCell colSpan={expiringHeader.length}>
                <NoData message="No data available" className="border-none" />
              </TableCell>
            </TableRow>
          ) : (
            items.map((item: any) => {
              const daysLeft = getDaysLeft(item.expiryDate);
              return (
                <TableRow key={item.stockId}>
                  <TableCell>
                    <span className="text-txt1 font-bold">
                      {item.productName}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-txt3">{item.categoryName || "-"}</span>
                  </TableCell>
                  <TableCell>
                    <span>{item.brandName || "-"}</span>
                  </TableCell>
                  <TableCell>
                    <span>{item.batchNo || "-"}</span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span>{formatDate(item.expiryDate)}</span>
                  </TableCell>
                  <TableCell className="text-center">
                    <StatusCard
                      status={`${daysLeft} days`}
                      color={daysLeft <= 30 ? "red" : "orange"}
                    />
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="text-txt1 font-bold">
                      {item.quantity ?? 0}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <span>₹{item.mrp}</span>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </tbody>
      </Table>
    </div>
  );
}
