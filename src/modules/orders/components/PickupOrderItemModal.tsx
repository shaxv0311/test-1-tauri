import { useEffect, useMemo, useState } from "react";
import { AsyncPaginate } from "react-select-async-paginate";
import { CircleCheck, Plus, RefreshCw } from "lucide-react";
// import { FaHashtag } from "react-icons/fa";
// import { MdOutlineEdit, MdOutlineInventory2 } from "react-icons/md";

import Input from "../../../components/ui/Input";
import Button from "../../../components/ui/Button";
import CloseIcon from "../../../components/ui/CloseIcon";
import IconBox from "../../../components/ui/IconBox";
import {
  asyncPaginateStyle,
  selectMenuPortalTarget,
} from "../../../hooks/asyncPaginateStyle";
import { useCalculateAction } from "../../../hooks/useCalculateAction";
import { useProductLoader } from "../../inventory/hooks/useproductLoader";
import {
  useGetProductBatchesQuery,
  useLazyGetproductsQuery,
} from "../../../api/featutres/inventryFeatures/inventryApi/productApi";

/** A pickup order line as held by the order form / page. */
export interface PickupOrderLine {
  productId: number;
  stockId: number;
  product_name: string;
  batch_no?: string;
  quantity: number;
  price: number;
  gst: number;
}

interface ProductOption {
  value: number;
  label: string;
  raw?: any;
}

interface PickupOrderItemModalProps {
  isOpen: boolean;
  /** Line being edited; omit/null to add a new one. */
  item?: PickupOrderLine | null;
  onClose: () => void;
  onSave: (line: PickupOrderLine) => void;
}

/**
 * Add / edit a single pickup order line.
 *
 * The API stores a `stockId` per line, so a batch must be picked alongside the
 * product. Batches are only offered when they hold stock and are not expired,
 * mirroring the server-side validation.
 */
export default function PickupOrderItemModal({
  isOpen,
  item,
  onClose,
  onSave,
}: PickupOrderItemModalProps) {
  const calc = useCalculateAction();
  const isEdit = Boolean(item);

  const [triggerGetProducts] = useLazyGetproductsQuery();
  const { loadProductOptions } = useProductLoader(triggerGetProducts);

  const [product, setProduct] = useState<ProductOption | null>(null);
  const [stockId, setStockId] = useState<number | undefined>(undefined);
  const [quantity, setQuantity] = useState(1);
  const [price, setPrice] = useState(0);
  const [error, setError] = useState("");

  // Seed the form every time the popup opens so an edit shows stored values
  // and a fresh add starts clean.
  useEffect(() => {
    if (!isOpen) return;

    setProduct(
      item ? { value: item.productId, label: item.product_name } : null,
    );
    setStockId(item?.stockId);
    setQuantity(item?.quantity ?? 1);
    setPrice(item?.price ?? 0);
    setError("");
  }, [isOpen, item]);

  const { data: productDetail, isFetching: isBatchesLoading } =
    useGetProductBatchesQuery(product?.value ?? 0, {
      skip: !isOpen || !product?.value,
    });

  const availableBatches: any[] = useMemo(() => {
    const batches = productDetail?.stock ?? [];
    const today = new Date().toISOString().slice(0, 10);

    return batches.filter((batch: any) => {
      if (calc.invCal.batchPieces(batch) <= 0) return false;
      if (batch?.expiry_date && batch.expiry_date < today) return false;
      return batch?.stock_status !== "expired";
    });
  }, [productDetail, calc]);

  const selectedBatch = useMemo(
    () => availableBatches.find((batch: any) => batch.id === stockId),
    [availableBatches, stockId],
  );

  const formatBatchLabel = (batch: any): string =>
    `Batch ${batch?.batch_no ?? "-"} · Exp ${
      batch?.expiry_date ? batch.expiry_date : "No expiry"
    } · ${calc.invCal.batchPieces(batch)} pcs (${calc.toNumber(
      batch?.quantity,
    )} pack × ${calc.invCal.batchPack(batch)})`;

  const loadBatchOptions = (search: string) => {
    const term = search.trim().toLowerCase();
    const options = availableBatches
      .filter((batch: any) =>
        String(batch?.batch_no ?? "")
          .toLowerCase()
          .includes(term),
      )
      .map((batch: any) => ({
        value: batch.id,
        label: formatBatchLabel(batch),
        raw: batch,
      }));

    return Promise.resolve({ options, hasMore: false });
  };

  const lineTotal = useMemo(
    () => calc.round2(calc.toNumber(quantity) * calc.toNumber(price)),
    [quantity, price, calc],
  );

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!product?.value) {
      setError("Product is required");
      return;
    }
    if (!stockId) {
      setError("Stock batch is required");
      return;
    }

    const qty = Math.round(calc.toNumber(quantity));
    if (!Number.isInteger(qty) || qty < 1) {
      setError("Quantity must be at least 1");
      return;
    }

    // Per-piece unit price — can be paise (e.g. 4.00 / 10 = 0.4), so it is
    // not clamped to whole rupees. Validation only guards against negatives.
    const unitPrice = calc.round2(calc.toNumber(price));
    if (unitPrice < 0) {
      setError("Price cannot be negative");
      return;
    }

    onSave({
      productId: product.value,
      stockId,
      product_name: product.label,
      batch_no: selectedBatch?.batch_no ?? item?.batch_no,
      quantity: qty,
      price: unitPrice,
      // GST is set at the order level (Tax picker), not per item.
      gst: 0,
    });
  };

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
            {/* <IconBox
              icon={
                isEdit ? (
                  <MdOutlineEdit size={23} />
                ) : (
                  <MdOutlineInventory2 size={23} />
                )
              }
              className="icon-box-lg"
            /> */}

            <div className="flex flex-col gap-1 min-w-0">
              <h3 className="m-0 text-lg font-bold text-txt1 text-truncate">
                {isEdit ? "Edit Order Item" : "Add Order Item"}
              </h3>
              <p className="text-xs text-txt2">
                Pick the product and the batch the item will be collected from.
              </p>
            </div>
          </div>

          <CloseIcon onClose={onClose} />
        </div>

        <div className="modal-body scrollbar-hide">
          <div className="invoice-item-grid">
            <div className="flex flex-col gap-1">
              <div className="invoice-label-row">
                <label className="text-xs font-medium text-txt1">Product</label>
                <RefreshCw
                  onClick={() => {
                    setProduct(null);
                    setStockId(undefined);
                  }}
                  size={15}
                  className="cursor-pointer text-primary"
                />
              </div>
              <AsyncPaginate
                value={product}
                onChange={(value) => {
                  setProduct(value as ProductOption | null);
                  setStockId(undefined);
                }}
                isSearchable
                isClearable
                loadOptions={loadProductOptions}
                placeholder="Search & select a product…"
                styles={asyncPaginateStyle(false)}
                menuPortalTarget={selectMenuPortalTarget()}
                additional={{ page: 1 }}
              />
            </div>

            <div className="flex flex-col gap-1">
              <div className="invoice-label-row">
                <label className="text-xs font-medium text-txt1">
                  Stock Batch
                </label>
              </div>
              <AsyncPaginate
                key={`batch-select-${product?.value ?? "none"}`}
                value={
                  selectedBatch
                    ? {
                        value: selectedBatch.id,
                        label: formatBatchLabel(selectedBatch),
                      }
                    : null
                }
                isDisabled={!product?.value}
                onChange={(value) => {
                  const picked = availableBatches.find(
                    (batch: any) => batch.id === (value as any)?.value,
                  );
                  setStockId((value as any)?.value as number);

                  // The pack size lives on the batch, so the per-piece price
                  // can only be resolved here. It stays editable — this is
                  // just the correct default.
                  if (picked) {
                    const auto = calc.invCal.piecePriceFromBatch(
                      product?.raw?.sell_price,
                      picked,
                    );
                    if (auto > 0) setPrice(auto);
                  }
                }}
                isSearchable
                isClearable
                loadOptions={loadBatchOptions}
                placeholder={
                  isBatchesLoading ? "Loading batches…" : "Search batch no…"
                }
                noOptionsMessage={() => "No available batch"}
                styles={asyncPaginateStyle(false)}
                menuPortalTarget={selectMenuPortalTarget()}
                additional={{ page: 1 }}
              />
              {product?.value &&
                !isBatchesLoading &&
                availableBatches.length === 0 && (
                  <span className="text-xs text-red">
                    No available stock batch for this product
                  </span>
                )}
            </div>
          </div>

          <div className="invoice-qty-grid">
            <Input
              label="Quantity (pcs)"
              type="number"
              min={1}
              step={1}
              placeholder="1"
              labelClassName="text-xs font-medium"
              className="bg-white"
              // icon={<FaHashtag size={12} />}
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
            />

            <Input
              label="Unit Price (₹) / pc"
              type="number"
              min={0}
              step={0.01}
              placeholder="Select a batch to auto-fill"
              labelClassName="text-xs font-medium"
              className="bg-white"
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
            />
          </div>

          {selectedBatch && product?.raw?.sell_price != null && (
            <span className="text-xs text-txt2">
              Sell price {calc.formatCurrency(product.raw.sell_price)} ÷ pack
              size {calc.invCal.batchPack(selectedBatch)} ={" "}
              {calc.formatCurrency(price)} per pc · you can edit the price
            </span>
          )}

          <div className="purchase-item-net">
            <span className="text-xs font-semibold text-txt3">Line Total</span>
            <strong>{calc.formatCurrency(lineTotal)}</strong>
          </div>

          {error && <span className="text-xs text-red">{error}</span>}
        </div>

        <div className="modal-footer">
          <Button
            variant="outline"
            className="modal-footer-btn"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="button"
            className="modal-footer-btn"
            onClick={handleSubmit}
          >
            {isEdit ? <CircleCheck size={18} /> : <Plus size={18} />}
            {isEdit ? "Update Item" : "Add Item"}
          </Button>
        </div>
      </div>
    </div>
  );
}
