import type { ReactNode } from "react";
import { X } from "lucide-react";

import Button from "../../../components/ui/Button";
import CircleLoader from "../../../components/ui/CircleLoader";
import { formatDateDMY } from "../../../helper/date";
import { useGetSalesReplaceByIdQuery } from "../../../api/featutres/salesReplaceFeatures/salesReplaceApi";

interface SalesReplaceDetailModalProps {
  id: number;
  onClose: () => void;
}

/**
 * The list rows already carry everything the API returns for a replacement, so
 * this refetches the single record to show the batch's current state after the
 * stock was added back.
 */
export default function SalesReplaceDetailModal({
  id,
  onClose,
}: SalesReplaceDetailModalProps) {
  const { data, isLoading } = useGetSalesReplaceByIdQuery(id);
  const record = data?.salesReplace;

  const facts: Array<{ label: string; value: ReactNode }> = record
    ? [
        { label: "Product", value: record.product_name || "-" },
        {
          label: "Batch No",
          value: record.batch_no || "Default batch",
        },
        {
          label: "Expiry",
          value: record.expiry_date || "-",
        },
        { label: "Quantity Added", value: `${record.quantity} pcs` },
        {
          label: "Total Price",
          value: `₹${record.price.toLocaleString("en-IN")}`,
        },
        {
          label: "Recorded On",
          value: formatDateDMY(record.createdAt),
        },
      ]
    : [];

  return (
    <div
      className="modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-panel modal-panel-md">
        <div className="flex items-center justify-between invoice-modal-head">
          <h3 className="invoice-section-heading">
            Replacement {record ? `#${record.id}` : ""}
          </h3>
          <button
            type="button"
            className="invoice-item-remove"
            onClick={onClose}
          >
            <X size={16} />
          </button>
        </div>

        {/* Same reason as the form modal: the panel is the flex column and
            clips, so the inner column must be the shrinkable child. */}
        <div className="flex flex-col flex-1 min-h-0">
          <div className="invoice-modal-body flex-1 min-h-0">
            {isLoading ? (
              <CircleLoader />
            ) : (
              <>
                <div className="sales-replace-detail-grid">
                  {facts.map((fact) => (
                    <div key={fact.label} className="flex flex-col gap-1">
                      <span className="text-xs text-txt3">{fact.label}</span>
                      <span className="text-sm font-semibold text-txt1">
                        {fact.value}
                      </span>
                    </div>
                  ))}
                </div>

                {!!record?.incomeExpenseId && (
                  <div className="sales-note">
                    <span>
                      Booked as expense #{record.incomeExpenseId}. Removing this
                      replacement deletes that expense entry too.
                    </span>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="modal-footer">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}