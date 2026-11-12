import { Package } from "lucide-react";

import Button from "../../../components/ui/Button";
import StatusCard from "../../../components/ui/StatusCard";
import CircleLoader from "../../../components/ui/CircleLoader";
import IconBox from "../../../components/ui/IconBox";
import CloseIcon from "../../../components/ui/CloseIcon";
import NoData from "../../../components/table/noData";
import { formatDateDMY } from "../../../helper/date";
import { useCalculateAction } from "../../../hooks/useCalculateAction";
import { useGetPickupOrderByIdQuery } from "../../../api/featutres/orderFeatures/pickupOrderApi";

interface PickupOrderDetailModalProps {
  id: number;
  onClose: () => void;
}

/**
 * Read-only preview of a single pickup order. The detail is refetched here so
 * the view always shows what is stored rather than a stale list row.
 */
export default function PickupOrderDetailModal({
  id,
  onClose,
}: PickupOrderDetailModalProps) {
  const calc = useCalculateAction();
  const { data, isLoading } = useGetPickupOrderByIdQuery(id, {
    skip: !id,
  });

  const order = data?.order;
  const items = order?.items ?? [];
  const isDelivered = order?.orderStatus === "delivered";

  const grandTotal = calc.round2(
    items.reduce((sum: number, item: any) => sum + calc.toNumber(item.total), 0),
  );

  return (
    <div
      className="modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-panel modal-panel-lg">
        <div className="modal-header">
          <div className="modal-header-left">
            <IconBox icon={<Package size={23} />} className="icon-box-lg" />

            <div className="flex flex-col gap-1 min-w-0">
              <h3 className="m-0 text-lg font-bold text-txt1 text-truncate">
                Pickup Order #{order?.id ?? id}
              </h3>
              <p className="text-xs text-txt2">
                {order?.patient_name ? order.patient_name : "Order details"}
              </p>
            </div>
          </div>

          <CloseIcon onClose={onClose} />
        </div>

        <div className="modal-body scrollbar-hide">
          {isLoading ? (
            <CircleLoader loadingText="Loading order…" />
          ) : !order ? (
            <NoData message="Failed to load order details." />
          ) : (
            <div className="flex flex-wrap items-center gap-5">
              <div className="flex flex-col gap-1">
                <span className="text-xs text-txt3">Customer</span>
                <span className="text-sm font-semibold text-txt1">
                  {order.patient_name || "-"}
                </span>
              </div>
              {(order.doctor_name ||
                order.phone_number ||
                order.email ||
                order.address) && (
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-txt3">Doctor</span>
                    <span className="text-sm font-semibold text-txt1">
                      {order.doctor_name || "-"}
                    </span>
                  </div>
                )}
              <div className="flex flex-col gap-1">
                <span className="text-xs text-txt3">Contact</span>
                {order.phone_number && (
                  <span className="text-sm font-semibold text-txt1">
                    {order.phone_number}
                  </span>
                )}

              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-txt3">Email</span>
                {order.email && (
                  <span className="text-sm font-semibold text-txt1">
                    {order.email}
                  </span>
                )}

              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-txt3">Address</span>
                {order.address && (
                  <span className="text-xs text-txt2">{order.address}</span>
                )}

              </div>



              <div className="flex flex-col gap-1">
                <span className="text-xs text-txt3">Order Date</span>
                <span className="text-sm font-semibold text-txt1">
                  {order.orderDate ? formatDateDMY(order.orderDate) : "-"}
                </span>
              </div>
              {isDelivered && (
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-txt3">Delivered Date</span>
                  <span className="text-sm font-semibold text-txt1">
                    {order.deliveredDate
                      ? formatDateDMY(order.deliveredDate)
                      : "-"}
                  </span>
                </div>
              )}
              <div className="flex flex-col gap-1">
                <span className="text-xs text-txt3">Status</span>
                <StatusCard
                  status={order.orderStatus}
                  color={isDelivered ? "green" : "orange"}
                  isShow
                />
              </div>

              <div className="w-full flex-shrink-0">
                {items.length > 0 ? (
                  <div
                    className="invoice-item-list mt-0"
                    style={{ overflowX: "auto" }}
                  >
                    <div className="orders-detail-table">
                      <div className="orders-detail-row orders-detail-head">
                        <span>Product</span>
                        <span>Batch</span>
                        <span className="text-center">Qty</span>
                        <span className="text-right">Price</span>
                        <span className="text-right">GST</span>
                        <span className="text-right">Total</span>
                      </div>

                      {items.map((item: any) => (
                        <div key={item.id} className="orders-detail-row">
                          <span className="text-truncate">
                            {item.product_name ?? `Product #${item.productId}`}
                          </span>
                          <span className="text-txt3">
                            {item.batch_no ?? "-"}
                          </span>
                          <span className="text-center">{item.quantity} pcs</span>
                          <span className="text-right">
                            {calc.formatCurrency(item.price)}
                          </span>
                          <span className="text-right">
                            {calc.toNumber(item.gst)}%
                          </span>
                          <span className="text-right font-semibold">
                            {calc.formatCurrency(item.total)}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="purchase-item-net">
                      <span className="text-xs font-semibold text-txt3">
                        Order Total
                      </span>
                      <strong>{calc.formatCurrency(grandTotal)}</strong>
                    </div>
                  </div>
                ) : (
                  <NoData message="No items on this order." />
                )}
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <Button variant="outline" className="modal-footer-btn" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
