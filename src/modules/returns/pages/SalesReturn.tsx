import { useCallback, useMemo, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AsyncPaginate } from "react-select-async-paginate";
import { useNavigate } from "react-router-dom";
import {
  History,
  Package,
  Plus,
  RefreshCw,
  Stethoscope,
  Trash2,
  Undo2,
  User,
  X,
} from "lucide-react";
// import { FaHashtag } from "react-icons/fa";
// import { MdOutlineInventory2 } from "react-icons/md";

import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import NoData from "../../../components/table/noData";
import StatusCard from "../../../components/ui/StatusCard";
import { SectionTitle } from "../../quotation/component/SectionTitle";
import { setToastMessage } from "../../../helper/helper";
import { ROUTES } from "../../../router/routes";
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
import { useCreateSalesReturnMutation } from "../../../api/featutres/salesReturnFeatures/salesReturnApi";
import {
  defaultSalesReturn,
  salesReturnSchema,
  type SalesReturnForm,
} from "../../../api/featutres/salesReturnFeatures/salesReturnSchema";

/** The line currently being built inside the "Add Item" modal. */
interface StagedItem {
  product: { value: number; label: string; raw: any } | null;
  stockId?: number;
  quantity: number;
}

const defaultStagedItem: StagedItem = {
  product: null,
  quantity: 1,
};

export default function SalesReturn() {
  const navigate = useNavigate();
  const calc = useCalculateAction();

  const [triggerGetProducts] = useLazyGetproductsQuery();
  const { loadProductOptions } = useProductLoader(triggerGetProducts);

  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [staged, setStaged] = useState<StagedItem>(defaultStagedItem);
  const [itemError, setItemError] = useState("");

  const {
    control,
    handleSubmit,
    reset,
    register,
    getValues,
    formState: { errors },
  } = useForm<SalesReturnForm>({
    resolver: zodResolver(salesReturnSchema) as any,
    defaultValues: defaultSalesReturn,
  });

  const { fields, append, remove, update } = useFieldArray({
    control,
    name: "items",
  });

  const [createSalesReturn, { isLoading: isSaving }] =
    useCreateSalesReturnMutation();

  /**
   * Batches are not part of the product list payload, so the batches for the
   * staged product are fetched on demand. The API requires a `stockId` per
   * replacement line, so this is mandatory, not cosmetic.
   */
  const { data: productDetail, isFetching: isBatchesLoading } =
    useGetProductBatchesQuery(staged.product?.value ?? 0, {
      skip: !isAddItemOpen || !staged.product?.value,
    });

  /**
   * Only batches the API will actually accept as a replacement are offered.
   *
   * Availability is measured in pieces (`batchPieces`) rather than packs,
   * because a part-used pack reads `quantity: 0` while still holding stock —
   * filtering on `quantity` would hide usable batches. Expired batches are
   * dropped here too, since `stock_status` is only recomputed on write and can
   * lag behind the expiry date.
   */
  const availableBatches: any[] = useMemo(() => {
    const batches = productDetail?.stock ?? [];
    const today = new Date().toISOString().slice(0, 10);

    return batches.filter((batch: any) => {
      if (calc.invCal.batchPieces(batch) <= 0) return false;
      if (batch?.expiry_date && batch.expiry_date < today) return false;
      return batch?.stock_status !== "expired";
    });
  }, [productDetail, calc]);

  const stagedBatch = useMemo(
    () =>
      staged.stockId
        ? availableBatches.find((b: any) => b.id === staged.stockId)
        : undefined,
    [availableBatches, staged.stockId],
  );

  /** Pieces the staged batch can still give out, minus what this line already took. */
  const stagedAvailable = useMemo(() => {
    if (!stagedBatch) return 0;

    const total = calc.invCal.batchPieces(stagedBatch);
    const alreadyStaged = calc.toNumber(
      getValues("items")?.find(
        (item) =>
          item.productId === staged.product?.value &&
          item.stockId === staged.stockId,
      )?.quantity,
    );

    return Math.max(0, total - alreadyStaged);
  }, [stagedBatch, staged.product?.value, staged.stockId, calc, getValues]);

  const formatBatchLabel = useCallback(
    (batch: any): string =>
      `Batch ${batch?.batch_no ?? "-"} · Exp ${batch?.expiry_date ? batch.expiry_date : "No expiry"} · ${calc.invCal.batchPieces(
        batch,
      )} pcs (${calc.toNumber(batch?.quantity)} pack × ${calc.invCal.batchPack(
        batch,
      )})`,
    [calc],
  );

  const loadBatchOptions = useCallback(
    (search: string) => {
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
    },
    [availableBatches, formatBatchLabel],
  );

  const openAddItem = () => {
    setStaged(defaultStagedItem);
    setItemError("");
    setIsAddItemOpen(true);
  };

  const closeAddItem = () => {
    setIsAddItemOpen(false);
    setStaged(defaultStagedItem);
    setItemError("");
  };

  /**
   * The API validates each line against the batch independently, so two lines
   * on the same batch would each pass while together over-drawing the stock.
   * Adding to the existing line keeps the batch netted to a single request.
   */
  const handleAddItem = (): boolean => {
    if (!staged.product?.value) {
      setItemError("Product is required");
      return false;
    }
    if (!staged.stockId) {
      setItemError("Stock batch is required");
      return false;
    }

    const quantity = calc.toNumber(staged.quantity);
    if (!Number.isInteger(quantity) || quantity < 1) {
      setItemError("Quantity must be at least 1");
      return false;
    }

    if (!stagedBatch) {
      setItemError("Selected stock batch is no longer available");
      return false;
    }

    if (quantity > stagedAvailable) {
      setItemError(
        `Only ${stagedAvailable} pcs available in this batch for the replacement`,
      );
      return false;
    }

    const line = {
      productId: staged.product.value,
      stockId: staged.stockId,
      quantity,
      product_name: staged.product.label,
      batch_no: stagedBatch.batch_no ?? undefined,
    };

    const existingIndex = getValues("items")?.findIndex(
      (item) =>
        item.productId === line.productId && item.stockId === line.stockId,
    );

    if (existingIndex !== undefined && existingIndex > -1) {
      const existing = getValues("items")[existingIndex];
      update(existingIndex, {
        ...existing,
        quantity: calc.toNumber(existing.quantity) + quantity,
      });
    } else {
      append(line);
    }

    return true;
  };

  // `fields` tracks the current form values, so the badge stays in step with
  // adds, merges and removals without a separate subscription.
  const totalPieces = useMemo(
    () => fields.reduce((sum, field) => sum + calc.toNumber(field.quantity), 0),
    [fields, calc],
  );

  const onSubmit = async (payload: SalesReturnForm) => {
    // The API rejects unknown fields, so only the two names and the item ids
    // are sent — the return number and user are assigned server-side.
    const body = {
      ...(payload.patient_name?.trim()
        ? { patient_name: payload.patient_name.trim() }
        : {}),
      ...(payload.doctor_name?.trim()
        ? { doctor_name: payload.doctor_name.trim() }
        : {}),
      items: payload.items.map((item) => ({
        productId: item.productId,
        stockId: item.stockId,
        quantity: item.quantity,
      })),
    };

    try {
      const res: any = await createSalesReturn(body).unwrap();

      if (res?.success) {
        setToastMessage(
          "success",
          res?.message || "Sales return created and replacement stock deducted",
        );
        reset(defaultSalesReturn);
        navigate(ROUTES.RETURNS.SALES_RETURN_HISTORY);
      }
    } catch (error: any) {
      // A 401 is already handled globally (toast + redirect to login).
      if (error?.status === 401) return;
      setToastMessage(
        "error",
        error?.data?.message || "Failed to create sales return",
      );
    }
  };

  return (
    <div className="section-body gap-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 shrink-0">
        <SectionTitle icon={<Undo2 size={20} />} title="New Sales Return" />

        <div className="flex items-center gap-4">
          <StatusCard
            status={`${fields.length} Items · ${totalPieces} Pcs`}
            color="blue"
            isShow
          />
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
          <div className="invoice-section-box">
            <SectionTitle icon={<User size={18} />} title="Patient & Doctor " />

            <div className="invoice-item-grid">
              <Input
                label="Patient Name (Optional)"
                placeholder="Patient name…"
                maxLength={200}
                labelClassName="text-xs font-medium"
                className="bg-white"
                icon={<User size={14} />}
                error={errors.patient_name?.message}
                {...register("patient_name")}
              />

              <Input
                label="Doctor Name (Optional)"
                placeholder="Doctor name…"
                maxLength={200}
                labelClassName="text-xs font-medium"
                className="bg-white"
                icon={<Stethoscope size={14} />}
                error={errors.doctor_name?.message}
                {...register("doctor_name")}
              />
            </div>
          </div>

          <div className="invoice-section-box">
            <SectionTitle
              // icon={<MdOutlineInventory2 size={18} />}
              title="Return Items"
            />

            {/* Only the replacement is recorded — the damaged item handed back
                by the customer is not tracked by the API. */}
            <div className="sales-return-note">
              <Package size={16} className="shrink-0" />
              <span>
                Add every product you are giving back to the customer. Stock is
                deducted from the selected batch as soon as the return is saved.
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="button"
                className="w-full sm-w-auto"
                onClick={openAddItem}
              >
                <Plus size={18} />
                Add Return Item
              </Button>
            </div>

            {fields.length > 0 ? (
              <div className="invoice-item-list">
                {fields.map((field, index) => (
                  <div key={field.id} className="invoice-item-row">
                    <div className="flex items-center flex-1 gap-3">
                      <span className="invoice-item-index">{index + 1}</span>
                      <div className="flex flex-col gap-1 flex-1">
                        <span className="text-sm font-medium text-truncate">
                          {field.product_name}
                        </span>
                        <span className="text-xs font-medium text-txt3">
                          {field.batch_no && (
                            <span className="invoice-item-sn">
                              Batch: {field.batch_no}
                            </span>
                          )}
                          Qty: {field.quantity} pcs
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      className="invoice-item-remove"
                      disabled={isSaving}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <NoData message="No return items added yet." />
            )}

            {errors.items?.message && (
              <span className="form-error">{errors.items.message}</span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="submit"
              className="invoice-submit-btn w-full sm-w-auto"
              loading={isSaving}
              disabled={isSaving || fields.length === 0}
            >
              Save Sales Return
            </Button>

            <Button
              type="button"
              variant="outline"
              className="w-full sm-w-auto"
              onClick={() => navigate(ROUTES.RETURNS.SALES_RETURN_HISTORY)}
            >
              <History size={18} />
              View History
            </Button>
          </div>
        </form>
      </div>

      {/* ── Add Replacement Item modal ── */}
      {isAddItemOpen && (
        <div
          className="modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeAddItem();
          }}
        >
          <div className="modal-panel modal-panel-md">
            <div className="flex items-center justify-between invoice-modal-head">
              <h3 className="invoice-section-heading">
                Select Product &amp; Batch
              </h3>
              <button
                type="button"
                className="invoice-item-remove"
                onClick={closeAddItem}
              >
                <X size={16} />
              </button>
            </div>

            <div className="invoice-modal-body">
              <div className="invoice-item-grid">
                <div className="flex flex-col gap-1">
                  <div className="invoice-label-row">
                    <label className="text-xs font-medium text-txt1">
                      Select Replacement Product
                    </label>
                    <RefreshCw
                      onClick={() =>
                        setStaged({
                          ...staged,
                          product: null,
                          stockId: undefined,
                        })
                      }
                      size={15}
                      className="cursor-pointer text-primary"
                    />
                  </div>
                  <AsyncPaginate
                    value={staged.product}
                    onChange={(value) =>
                      // The batches (and the pack sizes) depend on the
                      // product, so both are reset on every change.
                      setStaged((current) => ({
                        ...current,
                        product: value as any,
                        stockId: undefined,
                        quantity: 1,
                      }))
                    }
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
                      Select Stock Batch
                    </label>
                  </div>
                  <AsyncPaginate
                    key={`batch-select-${staged.product?.value ?? "none"}`}
                    value={
                      stagedBatch
                        ? {
                            value: stagedBatch.id,
                            label: formatBatchLabel(stagedBatch),
                          }
                        : null
                    }
                    isDisabled={!staged.product?.value}
                    onChange={(value) =>
                      setStaged((current) => ({
                        ...current,
                        stockId: value?.value as number,
                        quantity: 1,
                      }))
                    }
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
                  {staged.product?.value &&
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
                  label="Replacement Qty (pcs)"
                  type="number"
                  min={1}
                  step={1}
                  placeholder="1"
                  labelClassName="text-xs font-medium"
                  className="bg-white"
                  // icon={<FaHashtag size={12} />}
                  value={staged.quantity}
                  onChange={(e) =>
                    setStaged({
                      ...staged,
                      quantity: Number(e.target.value),
                    })
                  }
                />

                <div className="invoice-add-cell">
                  <div className="form-field">
                    <div className="form-label-row">
                      <label className="form-label text-xs font-medium">
                        &nbsp;
                      </label>
                    </div>
                    <Button
                      type="button"
                      className="w-full"
                      onClick={() => {
                        // Keep the modal open on a failure so the input the
                        // user just made can be corrected.
                        if (handleAddItem()) closeAddItem();
                      }}
                    >
                      <Plus size={18} />
                      Add Item
                    </Button>
                  </div>
                </div>
              </div>

              {/* Makes the pack conversion auditable instead of a black box. */}
              {stagedBatch && (
                <span className="text-xs text-txt2">
                  {calc.toNumber(stagedBatch.quantity)} pack ×{" "}
                  {calc.invCal.batchPack(stagedBatch)} ={" "}
                  {calc.invCal.batchPieces(stagedBatch)} pcs in batch ·{" "}
                  {stagedAvailable} pcs still available for this return
                </span>
              )}

              {itemError && (
                <span className="text-xs text-red">{itemError}</span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
