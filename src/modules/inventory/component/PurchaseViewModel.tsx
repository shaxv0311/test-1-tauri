import {
  Calendar,
  CreditCard,
  FileText,
  Wallet,
} from "lucide-react";
import CloseIcon from "../../../components/ui/CloseIcon";
import StatusCard from "../../../components/ui/StatusCard";
import { formatDateDMY } from "../../../helper/date";
import IconBox from "../../../components/ui/IconBox";
import { useGetPurchaseByIdQuery } from "../../../api/featutres/inventryFeatures/inventryApi/purchaseApi";
import Table from "../../../components/table/Table";
import TableHeader from "../../../components/table/TableHeader";
import TableRow from "../../../components/table/TableRow";
import TableCell from "../../../components/table/TableCell";
import CircleLoader from "../../../components/ui/CircleLoader";
import { useCalculateAction } from "../../../hooks/useCalculateAction";
import { calculate } from "../../../action/calcualtion";

const headerItemsDefault = [
  { label: "No", className: "text-center" },
  { label: "Product" },
  { label: "Batch No" },
  { label: "Pack Size", className: "text-right" },
  { label: "Quantity", className: "text-right" },
  { label: "MRP", className: "text-right" },
  { label: "Buy Price", className: "text-right" },
  { label: "Sell Price", className: "text-right" },
  { label: "Discount", className: "text-right" },
  { label: "GST", className: "text-right" },
  { label: "Net Value", className: "text-right" },
] as any;

/**
 * Net value of a purchase line.
 *
 * Previously this multiplied `gross` by `pack`, which the backend explicitly
 * does not do (purchase.service.ts:144-145: buy_price is already the price per
 * pack and quantity is the number of packs), and it rounded only once at the
 * end instead of after every step. Both now go through `PurCal.lineNet`, so
 * this view agrees with the stored `net_value`.
 */
const getNetValue = (item: any) => calculate.purCal.lineNet(item);

export default function PurchaseViewModel({
  data,
  onClose,
}: any) {
  const { data: response, isLoading } = useGetPurchaseByIdQuery(data?.id);
  const purchase = response?.data?.purchase ?? response?.purchase;
  const viewData = { ...data, ...(purchase ?? {}) };
  const calc = useCalculateAction();

  if (!data) return null;

  return (
    <div className="modal-overlay">
      <div
        className="purchase-view-panel"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <StatusCard status={`#${viewData.invoiceNo}`} color="blue" />
          <CloseIcon onClose={onClose} />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-txt1">
            {viewData.supplier_name || "—"}
          </span>
          <StatusCard
            status={viewData.payment_status}
            color={
              viewData.payment_status === "Paid"
                ? "green"
                : viewData.payment_status === "Unpaid"
                  ? "red"
                  : "orange"
            }
            isShow
          />
          <span className="purchase-view-date inline-flex items-center gap-1 text-sm">
            <Calendar size={14} />
            {formatDateDMY(viewData.invoiceDate)}
          </span>
        </div>

        <div className="purchase-view-stats">
          <div className="purchase-view-stat">
            <IconBox
              icon={<FileText size={20} />}
              className="purchase-view-icon purchase-view-icon-blue"
            />
            <div>
              <p className="text-txt1 text-sm font-bold">Total (₹)</p>
              <p className="purchase-view-amount text-primary">
                {calc.formatCurrency(viewData.total_amount)}
              </p>
            </div>
          </div>
          <div className="purchase-view-stat">
            <IconBox
              icon={<CreditCard size={20} />}
              className="purchase-view-icon purchase-view-icon-green"
            />
            <div>
              <p className="text-txt1 text-sm font-bold">Paid (₹)</p>
              <p className="purchase-view-amount text-green">
                {calc.formatCurrency(viewData.paid_amount)}
              </p>
            </div>
          </div>
          <div className="purchase-view-stat">
            <IconBox
              icon={<Wallet size={20} />}
              className="purchase-view-icon purchase-view-icon-red"
            />
            <div>
              <p className="text-txt1 text-sm font-bold">Due (₹)</p>
              <p className="purchase-view-amount text-red">
                {calc.formatCurrency(viewData.remaining_due)}
              </p>
            </div>
          </div>
          <div className="purchase-view-stat">
            <IconBox
              icon={<CreditCard size={20} />}
              className="purchase-view-icon purchase-view-icon-orange"
            />
            <div>
              <p className="text-txt1 text-sm font-bold">Credit (₹)</p>
              <p className="purchase-view-amount text-orange">
                {calc.formatCurrency(viewData.credit_amnt)}
              </p>
            </div>
          </div>
        </div>

        {isLoading ? (
          <CircleLoader />
        ) : (
          <div className="purchase-view-table">
            <Table>
              <TableHeader headerItems={headerItemsDefault} />
              <tbody>
                {purchase?.items?.length ? (
                  purchase.items.map((item: any, index: number) => (
                    <TableRow key={item.id ?? index}>
                      <TableCell className="text-center">{index + 1}</TableCell>
                      <TableCell>
                        <span className="text-txt1 font-bold">
                          {item.product_name || "—"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="purchase-value-muted">
                          {item.batch_no || "—"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-txt1 font-bold">
                          {calc.invCal.batchPack(item)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-txt1 font-bold">
                          {calc.toNumber(item.quantity)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        {calc.formatCurrency(item.mrp)}
                      </TableCell>
                      <TableCell className="text-right">
                        {calc.formatCurrency(item.buy_price)}
                      </TableCell>
                      <TableCell className="text-right">
                        {calc.formatCurrency(item.sell_price)}
                      </TableCell>
                      <TableCell className="text-right">
                        {calc.toNumber(item.discount).toFixed(2)}%
                      </TableCell>
                      <TableCell className="text-right">
                        {calc.toNumber(item.gst).toFixed(2)}%
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="purchase-value-green">
                          {calc.formatCurrency(getNetValue(item))}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={headerItemsDefault.length}>
                      <p className="py-5 text-center text-txt3">
                        No purchase items found
                      </p>
                    </TableCell>
                  </TableRow>
                )}
              </tbody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
