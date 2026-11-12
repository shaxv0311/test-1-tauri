import { ArrowLeft } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import Table from "../../../components/table/Table";
import TableCell from "../../../components/table/TableCell";
import TableHeader from "../../../components/table/TableHeader";
import TableRow from "../../../components/table/TableRow";
import NoData from "../../../components/table/noData";
import CircleLoader from "../../../components/ui/CircleLoader";
import StatusCard from "../../../components/ui/StatusCard";
import Button from "../../../components/ui/Button";
import { useGetProductsByIdQuery } from "../../../api/featutres/inventryFeatures/inventryApi/productApi";
import { ROUTES } from "../../../router/routes";
import { getStockStatusMeta } from "../../../helper/stockStatus";

const headerItems = [
  { label: "No", className: "text-center" },
  { label: "Batch No" },
  { label: "Pack Size", className: "text-center" },
  { label: "Quantity", className: "text-center" },
  { label: "Expiry Date" },
  { label: "Entry Type", className: "text-center" },
  { label: "Stock Status", className: "text-center" },
] as any;

function formatDate(value?: string | null) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("en-GB");
}

export default function ProductStockDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data, isLoading, isError } = useGetProductsByIdQuery(id, { skip: !id });

  const product = data?.product;
  const stockRows = data?.stock ?? [];

  return (
    <div className="section-body  ">
      <Button
        type="button"
        variant="outline"
        className="w-fit my-2"
        onClick={() => navigate(ROUTES.INVENTORY.PRODUCTS)}
      >
        <ArrowLeft size={16} />
        Back
      </Button>
      <div className="flex flex-wrap items-center justify-between  ">
        <div className="min-w-0">
          <h2 className="text-base sm-text-lg font-bold text-txt1 text-truncate">
            {product?.product_name ?? "Product Stock Batches"}
          </h2>
          <p className="text-xs text-txt3 my-2">
            Batch-wise stock list with availability status
          </p>
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          {product && (
            <>
              {product.hsn_code ? (
                <StatusCard
                  status={`HSN: ${product.hsn_code}`}
                  color="purple"
                />
              ) : null}
              <StatusCard
                status={`Qty: ${product.total_quantity ?? 0}`}
                color="blue"
              />
              <StatusCard
                status={product.status ? "Active" : "Inactive"}
                color={product.status ? "green" : "red"}
                isShow
              />
            </>
          )}


        </div>
      </div>

      {isLoading ? (
        <CircleLoader />
      ) : isError || !product ? (
        <NoData message="Product not found" className="border-none" />
      ) : (
        <Table minClassName="table-min-sm">
          <TableHeader headerItems={headerItems} />
          <tbody>
            {stockRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={headerItems.length}>
                  <NoData
                    message="No stock batches available for this product"
                    className="border-none"
                  />
                </TableCell>
              </TableRow>
            ) : (
              stockRows.map((batch: any, index: number) => {
                const statusMeta = getStockStatusMeta(batch?.stock_status);

                return (
                  <TableRow key={batch?.id ?? index}>
                    <TableCell className="text-center">{index + 1}</TableCell>
                    <TableCell>
                      <span className="text-txt1 font-bold">
                        {batch?.batch_no || "-"}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="text-txt1 font-bold">
                        {batch?.pack ?? 1}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="text-txt1 font-bold">
                        {batch?.quantity ?? batch?.stock_quantity ?? 0}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-txt3">
                        {formatDate(batch?.expiry_date)}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <StatusCard
                        status={batch?.manual_entry ? "Manual" : "Purchase"}
                        color={batch?.manual_entry ? "blue" : "orange"}
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <StatusCard
                        status={statusMeta.label}
                        color={statusMeta.color}
                        isShow
                      />
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </tbody>
        </Table>
      )}
    </div>
  );
}
