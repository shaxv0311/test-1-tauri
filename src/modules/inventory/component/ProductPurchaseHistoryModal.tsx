import { useEffect, useState } from "react";
import { AsyncPaginate } from "react-select-async-paginate";
import { History } from "lucide-react";
import Table from "../../../components/table/Table";
import TableHeader from "../../../components/table/TableHeader";
import TableRow from "../../../components/table/TableRow";
import TableCell from "../../../components/table/TableCell";
import TablePagination from "../../../components/table/BottomPagination";
import NoData from "../../../components/table/noData";
import CircleLoader from "../../../components/ui/CircleLoader";
import CloseIcon from "../../../components/ui/CloseIcon";
import IconBox from "../../../components/ui/IconBox";
import { asyncPaginateStyle } from "../../../hooks/asyncPaginateStyle";
import {
  useGetProductPurchasesQuery,
  useLazyGetproductsQuery,
} from "../../../api/featutres/inventryFeatures/inventryApi/productApi";
import { useProductLoader } from "../hooks/useproductLoader";
import { formatDateDMY } from "../../../helper/date";

const LIMIT = 10;

const headerItems = [
  { label: "No", className: "text-center" },
  // { label: "Date" },
  { label: "Purchase No" },
  { label: "Supplier" },
  // { label: "Batch" },
  // { label: "Qty", className: "text-center" },
  { label: "MRP", className: "text-right" },
  { label: "Sell", className: "text-right" },

  { label: "Buy", className: "text-right" },
  // { label: "Net", className: "text-right" },
] as any;

const toNumber = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatCurrency = (value: unknown) =>
  `₹${toNumber(value).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

interface ProductOption {
  value: number;
  label: string;
  raw?: { id: number; product_name: string };
}

interface ProductPurchaseRow {
  id: number;
  invoiceNo: string;
  invoiceDate: string;
  supplierName?: string | null;
  batchNo?: string | null;
  quantity: number;
  mrp: number | string;
  buyPrice: number | string;
  sellPrice: number | string;
  netValue: number | string | null;
}

interface ProductPurchaseHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProductPurchaseHistoryModal({
  isOpen,
  onClose,
}: ProductPurchaseHistoryModalProps) {
  const [selectedProduct, setSelectedProduct] = useState<ProductOption | null>(
    null,
  );
  const [page, setPage] = useState(1);

  const [triggerGetProducts] = useLazyGetproductsQuery();
  const { loadProductOptions } = useProductLoader(triggerGetProducts);

  const { data, isLoading, isFetching } = useGetProductPurchasesQuery(
    { id: selectedProduct?.value as number, page, limit: LIMIT },
    { skip: !isOpen || !selectedProduct },
  );

  const purchases: ProductPurchaseRow[] = data?.purchases ?? [];
  const pagination = data?.pagination;

  // Fresh start every time the popup is opened.
  useEffect(() => {
    if (!isOpen) {
      setSelectedProduct(null);
      setPage(1);
    }
  }, [isOpen]);

  if (!isOpen) return null;


  const purchaseHistoryAmountColors = (pagination: any, index: number) => {
    const isFirstItem = pagination?.page === 1 && index === 0;
    const isLastPage = pagination?.page === pagination?.totalPages;
    const isLastItem = index === pagination?.total - 1;

    if (isFirstItem) {
      return 'color-green';
    } else if (isLastPage && isLastItem) {
      return 'color-red';
    } else {
      return 'color-orange';
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-panel modal-panel-lg product-history-modal">
        <div className="modal-header">
          <div className="modal-header-left">
            <IconBox icon={<History size={22} />} className="icon-box-lg" />
            <div className="flex flex-col gap-1 min-w-0">
              <h3 className="m-0 text-lg font-bold text-txt1 text-truncate">
                Product Purchase History
              </h3>
              <p className="text-xs text-txt2 text-line-clamp-2">
                Search a product to see its latest purchase from each supplier.
              </p>
            </div>
          </div>
          <CloseIcon onClose={onClose} />
        </div>

        <div className="modal-body scrollbar-hide">
          <div className="form-field">
            <label className="form-label">Search Product</label>
            <AsyncPaginate
              value={selectedProduct}
              onChange={(value: ProductOption | null) => {
                setSelectedProduct(value);
                setPage(1);
              }}
              isSearchable
              isClearable
              loadOptions={loadProductOptions}
              placeholder="Search & select a product"
              styles={asyncPaginateStyle(false)}
              className="w-full"
              classNamePrefix="react-select"
              menuPortalTarget={document.body}
              menuPosition="fixed"
            />
          </div>

          {!selectedProduct ? (
            <NoData
              message="Select a product to view its purchase history"
              className="border-none"
            />
          ) : isLoading ? (
            <CircleLoader />
          ) : (
            <>
              {data?.product && (
                <div className="product-history-summary">
                  <div>
                    <p className="text-xs font-semibold text-txt3">Product</p>
                    <p className="text-sm font-bold text-txt1">
                      {data.product.product_name}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-txt3">Category</p>
                    <p className="text-sm text-txt1">
                      {data.product.category_name || "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-txt3">Brand</p>
                    <p className="text-sm text-txt1">
                      {data.product.brand_name || "—"}
                    </p>
                  </div>
                </div>
              )}

              <div className="product-history-table">
                <Table minClassName="table-min-md">
                  <TableHeader headerItems={headerItems} />
                  <tbody>
                    {purchases.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={headerItems.length}>
                          <NoData
                            message="No purchases found for this product"
                            className="border-none"
                          />
                        </TableCell>
                      </TableRow>
                    ) : (
                      purchases.map((item, index) => (
                        <TableRow key={item.id}>
                          <TableCell className="text-center">
                            {(pagination?.page - 1) * LIMIT + index + 1}
                          </TableCell>
                          {/* <TableCell>
                            <span className="text-txt3">
                              {formatDateDMY(item.invoiceDate)}
                            </span>
                          </TableCell> */}
                          <TableCell>
                            <span className="text-txt1 font-bold">
                              {item.invoiceNo} {pagination?.page == 1 && index == 0}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="text-txt1 font-bold">
                              {item.supplierName || "—"}
                            </span>
                          </TableCell>
                          {/* <TableCell>
                            <span className="text-txt3">
                              {item.batchNo || "—"}
                            </span>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className="text-txt1 font-bold">
                              {item.quantity ?? 0}
                            </span>
                          </TableCell> */}
                          <TableCell className={`text-right `}>
                            <span className={`text-txt1 font-bold  ${purchaseHistoryAmountColors(pagination, index)}`}>
                              {formatCurrency(item.mrp)}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <span className={`text-txt1 font-bold ${purchaseHistoryAmountColors(pagination, index)}`}>

                              {formatCurrency(item.sellPrice)}
                            </span>
                          </TableCell>

                          <TableCell className="text-right">
                            <span className={`text-txt1 font-bold ${purchaseHistoryAmountColors(pagination, index)}`}>

                              {formatCurrency(item.buyPrice)}
                            </span>
                          </TableCell>
                          {/* <TableCell className="text-right">
                            <span className="text-green font-bold">
                              {item.netValue === null
                                ? "—"
                                : formatCurrency(item.netValue)}
                            </span>
                          </TableCell> */}
                        </TableRow>
                      ))
                    )}
                  </tbody>
                </Table>
              </div>

              {pagination?.totalPages > 1 && (
                <TablePagination
                  total={pagination.total}
                  page={pagination.page}
                  totalPages={pagination.totalPages}
                  loading={isFetching}
                  onPageChange={setPage}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
