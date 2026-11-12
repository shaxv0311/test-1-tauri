import { Edit, Eye } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ActionButton from "../../../components/table/ActionButton";
import Table from "../../../components/table/Table";
import TableCell from "../../../components/table/TableCell";
import TableHeader from "../../../components/table/TableHeader";
import TableRow from "../../../components/table/TableRow";
import StatusCard from "../../../components/ui/StatusCard";
import SearchBox from "../component/SearchBox";
import AddProduct from "../component/AddProduct";
import { useGetproductsQuery } from "../../../api/featutres/inventryFeatures/inventryApi/productApi";
import NoData from "../../../components/table/noData";
import CircleLoader from "../../../components/ui/CircleLoader";
import TablePagination from "../../../components/table/BottomPagination";
import { ROUTES } from "../../../router/routes";

const headerItemsDefault = [
  { label: "No", className: "text-center" },
  { label: "Product", className: "product-col-name" },
  { label: "Category" },
  { label: "Brand" },
  { label: "MRP", className: "" },
  { label: "Buy Price", className: "" },
  { label: "Sell Price", className: "" },
  { label: "Profit", className: "" },
  { label: "Quantity", className: "text-center" },
  { label: "Status", className: "text-center" },
  { label: "Action", className: "text-center" },
] as any;

const toNumber = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const roundCurrency = (value: unknown) =>
  Math.round(toNumber(value) * 100) / 100;

const formatCurrency = (value: unknown) => {
  const amount = toNumber(value);
  return Number.isInteger(amount)
    ? amount.toLocaleString("en-IN")
    : amount.toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
};

export default function ProductsAndStocks() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeRow, setActiveRow] = useState<any>(null);
  const navigate = useNavigate();

  const [filter, setFilter] = useState({
    page: 1,
    limit: 10,
    search: "",
  });

  const { data: products, isLoading: isProductLoading } =
    useGetproductsQuery(filter);



  const handleAdd = () => {
    setActiveRow(null);
    setIsOpen(true);
  };

  const handleEdit = (data: any) => {
    setActiveRow(data);
    setIsOpen(true);
  };

  const handleViewStock = (id: number | string) => {
    navigate(ROUTES.INVENTORY.PRODUCT_STOCKS.replace(":id", String(id)));
  };

  const handleClose = () => {
    setIsOpen(false);
    setActiveRow(null);
  };

  return (
    <div className="section-body min-w-0">
      <SearchBox
        placeholdertxt="Search products by name..."
        btnText="Add New Product"
        setFilter={setFilter}
        filter={filter}
        onClick={handleAdd}
        className=""
      />
      {isProductLoading ? (
        <CircleLoader />
      ) : (
        <Table minClassName="table-min-md">
          <TableHeader headerItems={headerItemsDefault} />
          <tbody>
            {products?.products?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={headerItemsDefault.length} className="">
                  <NoData message="No data available" className="border-none" />
                </TableCell>
              </TableRow>
            ) : (
              products?.products?.map((item: any, index: number) => (
                <TableRow key={item?.id ?? index}>
                  <TableCell className="text-center">
                    <span>
                      {(products?.pagination?.page - 1) * filter.limit +
                        index +
                        1}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-txt1 font-bold">
                      {item?.product_name}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-txt3">
                      {item?.category_name || "-"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-txt1 font-bold">
                      {item?.brand_name || "-"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-txt1 font-bold">
                      ₹{formatCurrency(item.mrp)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-txt1 font-bold">
                      ₹{formatCurrency(item.buy_price)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-txt1 font-bold">
                      ₹{formatCurrency(item.sell_price)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-green font-bold">
                      ₹
                      {formatCurrency(
                        roundCurrency(
                          toNumber(item.sell_price) - toNumber(item.buy_price),
                        ),
                      )}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="text-txt1 font-bold">
                      {item.total_quantity ?? 0}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <div
                      // type="button"
                      // onClick={() => handleViewStock(item?.id)}
                      className="inline-flex"
                      title="View stock batches"
                    >
                      <StatusCard
                        status={item.status ? "Active" : "Inactive"}
                        color={item.status ? "green" : "red"}
                        isShow
                      />
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex justify-center items-center gap-2">
                      <ActionButton
                        icon={Eye}
                        onClick={() => handleViewStock(item?.id)}
                        color="primary"
                        text="View"
                      />
                      <ActionButton
                        icon={Edit}
                        onClick={() => handleEdit(item)}
                        color="primary"
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </tbody>
        </Table>
      )}

      {products?.pagination.totalPages > 1 && (
        <TablePagination
          total={products?.pagination.total}
          page={products?.pagination.page}
          totalPages={products?.pagination.totalPages}
          onPageChange={(page) => setFilter({ ...filter, page })}
        />
      )}

      <AddProduct isOpen={isOpen} onClose={handleClose} data={activeRow} />
    </div>
  );
}
