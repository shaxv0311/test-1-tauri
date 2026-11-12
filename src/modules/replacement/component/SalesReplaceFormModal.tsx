import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AsyncPaginate } from "react-select-async-paginate";
import {
  BadgeIndianRupee,
  CircleCheck,
  Info,
  Package,
  RefreshCw,
  X,
} from "lucide-react";
// import { FaHashtag } from "react-icons/fa";
// import { MdOutlineInventory2 } from "react-icons/md";

import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import Textarea from "../../../components/ui/TextArea";
import { setToastMessage } from "../../../helper/helper";
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
import { useCreateSalesReplaceMutation } from "../../../api/featutres/salesReplaceFeatures/salesReplaceApi";
import {
  defaultSalesReplace,
  salesReplaceSchema,
  type SalesReplaceForm,
} from "../../../api/featutres/salesReplaceFeatures/salesReplaceSchema";

interface SalesReplaceFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

/** The shape the product AsyncPaginate is controlled with. */
interface ProductOption {
  value: number;
  label: string;
  raw?: any;
}

/**
 * The batch fields this screen reads off `GET /products/:id`. `pack` and
 * `batch_total_quantity` are what turn a pack count into the piece count the
 * replacement actually adds.
 */
interface StockBatch {
  id: number;
  batch_no: string | null;
  pack?: number | null;
  quantity?: number | null;
  batch_total_quantity?: number | null;
  expiry_date?: string | null;
  stock_status?: string | null;
}

export default function SalesReplaceFormModal({
  isOpen,
  onClose,
  onSaved,
}: SalesReplaceFormModalProps) {
  const calc = useCalculateAction();

  const [triggerGetProducts] = useLazyGetproductsQuery();
  const { loadProductOptions } = useProductLoader(triggerGetProducts);

  /**
   * The product label has to be kept locally: the batch payload carries no
   * product name, and the form is reset between opens, so a controlled select
   * would otherwise show a bare id after reopening.
   */
  const [product, setProduct] = useState<ProductOption | null>(null);

  const {
    handleSubmit,
    register,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<SalesReplaceForm>({
    resolver: zodResolver(salesReplaceSchema) as any,
    defaultValues: defaultSalesReplace,
  });

  const [createSalesReplace, { isLoading: isSaving }] =
    useCreateSalesReplaceMutation();

  const productId = watch("productId");
  const stockId = watch("stockId");
  const quantity = watch("quantity");

  // The product list payload carries no batches, so they are fetched for the
  // selected product only. The API requires a `stockId`, so this is mandatory.
  const { data: productDetail, isFetching: isBatchesLoading } =
    useGetProductBatchesQuery(productId ?? 0, {
      skip: !isOpen || !productId,
    });

  /**
   * A replacement *adds* stock back, so every batch of the product qualifies —
   * including empty or expired ones. Unlike a sale there is nothing to draw
   * from, so nothing is filtered out; the batch status is shown in the label
   * instead so the choice stays informed.
   */
  const batches: StockBatch[] = useMemo(
    () => (productDetail?.stock ?? []) as StockBatch[],
    [productDetail],
  );

  const selectedBatch = useMemo(
    () => batches.find((batch) => batch.id === stockId),
    [batches, stockId],
  );

  // Total replacement amount is derived from the batch pack size: the product's
  // sell price is per pack, so per-piece unit price × quantity gives the total.
  const unitPrice = useMemo(() => {
    if (!product?.raw || !selectedBatch) return 0;
    return (
      calc.invCal.piecePriceFromBatch(product.raw?.sell_price, selectedBatch) ||
      0
    );
  }, [product, selectedBatch, calc]);

  useEffect(() => {
    const qty = calc.toNumber(quantity);
    if (unitPrice > 0 && qty > 0) {
      setValue("price", Number((unitPrice * qty).toFixed(2)), {
        shouldDirty: true,
      });
    }
  }, [unitPrice, quantity, setValue, calc]);

  const formatBatchLabel = useCallback(
    (batch: StockBatch): string =>
      `Batch ${batch?.batch_no ?? "-"} · Exp ${
        batch?.expiry_date ? batch.expiry_date : "No expiry"
      } · ${calc.invCal.batchPieces(batch)} pcs (${calc.toNumber(
        batch?.quantity,
      )} pack × ${calc.invCal.batchPack(batch)})`,
    [calc],
  );

  const loadBatchOptions = useCallback(
    (search: string) => {
      const term = search.trim().toLowerCase();

      const options = batches
        .filter((batch) =>
          String(batch?.batch_no ?? "")
            .toLowerCase()
            .includes(term),
        )
        .map((batch) => ({
          value: batch.id,
          label: formatBatchLabel(batch),
          raw: batch,
        }));

      return Promise.resolve({ options, hasMore: false });
    },
    [batches, formatBatchLabel],
  );

  const close = () => {
    reset(defaultSalesReplace);
    setProduct(null);
    onClose();
  };

  const onSubmit = async (payload: SalesReplaceForm) => {
    // The API rejects unknown fields (`additionalProperties: false`), so an
    // empty description is dropped rather than sent as "".
    const body = {
      productId: payload.productId,
      stockId: payload.stockId,
      quantity: payload.quantity,
      price: payload.price,
      ...(payload.description?.trim()
        ? { description: payload.description.trim() }
        : {}),
    };

    try {
      const res: any = await createSalesReplace(body).unwrap();

      if (res?.success) {
        setToastMessage(
          "success",
          res?.message ||
            "Replacement recorded, stock added and expense booked",
        );
        reset(defaultSalesReplace);
        setProduct(null);
        onSaved();
      }
    } catch (error: any) {
      // A 401 is already handled globally (toast + redirect to login).
      if (error?.status === 401) return;
      setToastMessage(
        "error",
        error?.data?.message || "Failed to record replacement",
      );
    }
  };

  if (!isOpen) return null;

  // Shown under the batch picker so the resulting pack count is predictable
  // rather than a side effect of a division on the server.
  const addedPieces = calc.toNumber(quantity) || 0;
  const currentPieces = selectedBatch
    ? calc.invCal.batchPieces(selectedBatch)
    : 0;
  const packSize = selectedBatch ? calc.invCal.batchPack(selectedBatch) : 1;
  const projectedPacks = selectedBatch
    ? Math.ceil((currentPieces + addedPieces) / (packSize || 1))
    : 0;

  return (
    <div
      className="modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div className="modal-panel modal-panel-md">
        <div className="flex items-center justify-between invoice-modal-head">
          <h3 className="invoice-section-heading">Add Sales Replacement</h3>
          <button
            type="button"
            className="invoice-item-remove"
            onClick={close}
            disabled={isSaving}
          >
            <X size={16} />
          </button>
        </div>

        {/*
          `flex-1 min-h-0` has to sit on the <form>, not on the body: `.modal-panel`
          is the flex column and clips at `max-height: 90vh`, while the <form> in
          between is a plain block. Without a shrinkable form the tall body pushes
          the footer past the clip and the quantity/price inputs below the fold
          become unreachable. The body then scrolls and the footer stays pinned.
        */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col flex-1 min-h-0"
        >
          <div className="invoice-modal-body flex-1 min-h-0">
            <div className="sales-note">
              <Info size={16} className="sales-note-icon" />
              <span>
                Saving adds the quantity back to the selected batch and records
                the price as an expense in Income &amp; Expense.
              </span>
            </div>

            <div className="invoice-item-grid">
              <div className="flex flex-col gap-1">
                <div className="invoice-label-row">
                  <label className="text-xs font-medium text-txt1">
                    Select Product
                  </label>
                  <RefreshCw
                    size={15}
                    className="cursor-pointer text-primary"
                    onClick={() => {
                      // The batch list belongs to the old product, so the id,
                      // the label and the batch id are cleared together.
                      setProduct(null);
                      reset(defaultSalesReplace);
                    }}
                  />
                </div>
                <AsyncPaginate
                  value={product}
                  onChange={(option: ProductOption | null) => {
                    setProduct(option ?? null);
                    // Picking a different product invalidates the batch.
                    setValue("stockId", 0);
                    setValue("productId", option?.value ?? 0);
                    setValue("price", 0);
                  }}
                  isSearchable
                  isClearable
                  loadOptions={loadProductOptions}
                  placeholder="Search & select a product…"
                  styles={asyncPaginateStyle(Boolean(errors.productId))}
                  menuPortalTarget={selectMenuPortalTarget()}
                  additional={{ page: 1 }}
                />
                {errors.productId?.message && (
                  <span className="form-error">{errors.productId.message}</span>
                )}
              </div>

              <div className="flex flex-col gap-1">
                <div className="invoice-label-row">
                  <label className="text-xs font-medium text-txt1">
                    Select Stock Batch
                  </label>
                </div>
                <AsyncPaginate
                  key={`batch-select-${productId ?? "none"}`}
                  value={
                    selectedBatch
                      ? {
                          value: selectedBatch.id,
                          label: formatBatchLabel(selectedBatch),
                        }
                      : null
                  }
                  isDisabled={!productId}
                  onChange={(option: ProductOption | null) =>
                    setValue("stockId", option?.value ?? 0)
                  }
                  isSearchable
                  isClearable
                  loadOptions={loadBatchOptions}
                  placeholder={
                    isBatchesLoading ? "Loading batches…" : "Search batch no…"
                  }
                  noOptionsMessage={() => "No stock batch for this product"}
                  styles={asyncPaginateStyle(Boolean(errors.stockId))}
                  menuPortalTarget={selectMenuPortalTarget()}
                  additional={{ page: 1 }}
                />
                {errors.stockId?.message && (
                  <span className="form-error">{errors.stockId.message}</span>
                )}
                {/*
                  `!!productId` guards a real React footgun: `productId` is the
                  number 0 before a product is picked, and `{0 && <span/>}`
                  renders a literal "0" into the DOM.
                */}
                {!!productId && !isBatchesLoading && batches.length === 0 && (
                  <span className="text-xs text-red">
                    This product has no stock batch yet
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
                isRequired
                labelClassName="text-xs font-medium"
                className="bg-white"
                // icon={<FaHashtag size={12} />}
                error={errors.quantity?.message}
                {...register("quantity", { valueAsNumber: true })}
              />

              <Input
                label="Total Price (₹)"
                type="number"
                min={0}
                step="0.01"
                placeholder="0.00"
                isRequired
                labelClassName="text-xs font-medium"
                className="bg-white"
                icon={<BadgeIndianRupee size={14} />}
                error={errors.price?.message}
                {...register("price", { valueAsNumber: true })}
              />
            </div>

            {unitPrice > 0 && calc.toNumber(quantity) > 0 && (
              <span className="text-xs text-txt2">
                {calc.formatCurrency(product?.raw?.sell_price)} ÷ pack size{" "}
                {selectedBatch ? calc.invCal.batchPack(selectedBatch) : "-"} ={" "}
                {calc.formatCurrency(unitPrice)} per pc ×{" "}
                {calc.toNumber(quantity)} pcs ={" "}
                {calc.formatCurrency(unitPrice * calc.toNumber(quantity))}
              </span>
            )}

            {/* <Textarea
              label="Description (optional)"
              rows={2}
              maxLength={255}
              placeholder="Reason for the replacement…"
              className="bg-white"
              error={errors.description?.message}
              {...register("description")}
            /> */}

            {/* Makes the pack conversion auditable instead of a black box. */}
            {selectedBatch && (
              <div className="sales-replace-projection">
                <div className="flex items-center gap-2">
                  <Package size={15} className="text-primary" />
                  <span className="text-xs font-semibold text-txt1">
                    Batch {selectedBatch.batch_no ?? "-"} after saving
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-4">
                  <span className="flex items-center gap-1 text-xs text-txt2">
                    {/* <MdOutlineInventory2 size={12} /> */}
                    {currentPieces} → {currentPieces + addedPieces} pcs
                  </span>
                  <span className="text-xs text-txt2">
                    {calc.toNumber(selectedBatch.quantity)} → {projectedPacks}{" "}
                    pack × {packSize}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="modal-footer">
            <Button
              type="button"
              variant="outline"
              onClick={close}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button type="submit" loading={isSaving} disabled={isSaving}>
              <CircleCheck size={18} />
              Save Replacement
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
