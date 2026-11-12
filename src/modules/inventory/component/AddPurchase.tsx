import { CircleCheck, PlusCircle } from "lucide-react";
// import { MdOutlineDelete, MdOutlineEdit } from "react-icons/md";
import { useState } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AsyncPaginate } from "react-select-async-paginate";
import Input from "../../../components/ui/Input";
import CloseIcon from "../../../components/ui/CloseIcon";
import Button from "../../../components/ui/Button";
import StatusCard from "../../../components/ui/StatusCard";
import NoData from "../../../components/table/noData";
import { ModalProps } from "../../../utils/type";
import {
  defaultPurchase,
  PurchaseForm,
  PurchaseItem,
  purchaseSchema,
} from "../../../api/featutres/inventryFeatures/inventrySchema/purchaseSchema";
import { useLazyGetSuppliersQuery } from "../../../api/featutres/inventryFeatures/inventryApi/brandCategorySupplierApi";
import { useLazyGetproductsQuery } from "../../../api/featutres/inventryFeatures/inventryApi/productApi";
import { useSupplierLoader } from "../hooks/useSupplierLoader";
import { useProductLoader } from "../hooks/useproductLoader";
import { asyncPaginateStyle } from "../../../hooks/asyncPaginateStyle";
import { useCreatePurchaseMutation } from "../../../api/featutres/inventryFeatures/inventryApi/purchaseApi";
import { setToastMessage } from "../../../helper/helper";
import PurchaseItemModal, { getItemNet } from "./PurchaseItemModal";
import { useCalculateAction } from "../../../hooks/useCalculateAction";

export default function AddPurchase({ onClose, isOpen }: ModalProps) {
  const calc = useCalculateAction();

  const [createPurchase, { isLoading: isCreateLoading }] =
    useCreatePurchaseMutation();
  const [triggerGetSupplier] = useLazyGetSuppliersQuery();
  const { loadSupplierOptions } = useSupplierLoader(triggerGetSupplier);
  const [triggerGetProducts] = useLazyGetproductsQuery();
  const { loadProductOptions } = useProductLoader(triggerGetProducts);

  // Line-item entry lives in its own popup; `editingItemIndex` is null for add.
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);

  const {
    register,
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<PurchaseForm>({
    resolver: zodResolver(purchaseSchema) as any,
    defaultValues: defaultPurchase,
  });

  const { fields, append, update, remove } = useFieldArray({
    control,
    name: "items",
  });
  const items = watch("items");
  const paidAmount = calc.toNumber(watch("paid_amount"));
  const creditAmount = calc.toNumber(watch("credit_amnt"));
  const itemsTotal = calc.purCal.itemsTotal(items);
  const totalAmount = Math.max(0, itemsTotal - creditAmount);

  /**
   * Due and status both come from `PurCal.payment`, which mirrors
   * derivePaymentStatus in purchase.service.ts:74-79. The old local version used
   * a `|remaining| < 0.01` tolerance, so a bill the API had already settled
   * could still read "Partial" here.
   */
  const { remainingDue, paymentStatus } = calc.purCal.payment(
    totalAmount,
    paidAmount,
  );
  const paidExceedsTotal = paidAmount > totalAmount;
  const creditExceedsItemsTotal = creditAmount > itemsTotal;

  const onSubmit = async (formData: PurchaseForm) => {
    const payload = {
      invoiceNo: formData.invoice_no.trim(),
      invoiceDate: formData.invoice_date,
      supplerId: formData.supplier!.value,
      paid_amount: formData.paid_amount,
      credit_amnt: formData.credit_amnt,
      items: formData.items.map((item) => {
        const batchNo = item.batch_no.trim();
        const expiryDate = item.expiry_date;

        return {
          productId: item.product!.value,
          ...(batchNo ? { batch_no: batchNo } : {}),
          quantity: item.quantity,
          pack: item.pack,
          free_quantity: item.free_quantity ?? 0,
          mrp: item.mrp,
          buy_price: item.buy_price,
          sell_price: item.sell_price,
          discount: item.discount,
          gst: item.gst,
          ...(expiryDate ? { expiry_date: expiryDate } : {}),
        };
      }),
    };

    try {
      const response = await createPurchase(payload).unwrap();
      if (response?.success) {
        setToastMessage(
          "success",
          response.message || "Purchase created successfully",
        );
        reset();
        onClose();
      }
    } catch (error: any) {
      if (error?.status === 401) {
        return;
      }
      setToastMessage("error", error?.data?.message || "Something went wrong");
    }
  };

  const paidAmountError = paidExceedsTotal
    ? "Paid amount cannot exceed the total amount"
    : errors.paid_amount?.message;

  const creditAmountError = creditExceedsItemsTotal
    ? "Credit amount cannot exceed the items total"
    : errors.credit_amnt?.message;

  const openItemModal = (index: number | null) => {
    setEditingItemIndex(index);
    setIsItemModalOpen(true);
  };

  const closeItemModal = () => {
    setIsItemModalOpen(false);
    setEditingItemIndex(null);
  };

  /** Add when no index is being edited, otherwise update that line in place. */
  const handleItemSave = (item: PurchaseItem) => {
    if (editingItemIndex === null) {
      append(item);
    } else {
      update(editingItemIndex, item);
    }
    closeItemModal();
  };

  const editingItem =
    editingItemIndex !== null ? (items[editingItemIndex] ?? null) : null;

  const excludedProductIds = items
    .filter((_, index) => index !== editingItemIndex)
    .map((item) => Number(item.product?.value))
    .filter((value) => Number.isFinite(value) && value > 0);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="purchase-modal">
        <div className="purchase-modal-head">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="m-0 text-base font-semibold text-txt1">
                Add New Purchase
              </h3>
              <p className="purchase-modal-desc">
                Record a supplier invoice and update stock.
              </p>
            </div>
            <CloseIcon
              onClose={() => {
                reset();
                onClose();
              }}
            />
          </div>
        </div>

        <form
          className="purchase-modal-form"
          id="purchaseForm"
          onSubmit={handleSubmit(onSubmit)}
        >
          <div className="purchase-meta-grid">
            <div className="form-field">
              <label className="form-label">Select Supplier</label>
              <Controller
                control={control}
                name="supplier"
                render={({ field }) => (
                  <AsyncPaginate
                    value={field.value}
                    onChange={field.onChange}
                    isSearchable
                    loadOptions={loadSupplierOptions}
                    placeholder="Select supplier"
                    styles={asyncPaginateStyle(
                      !!errors.supplier?.value?.message,
                    )}
                    className="purchase-supplier-select"
                    classNamePrefix="react-select"
                  />
                )}
              />
              {errors.supplier?.value?.message && (
                <span className="text-xs text-red">
                  {errors.supplier.value.message}
                </span>
              )}
            </div>
            <Input
              label="Purchase Number"
              placeholder="e.g. PUR-001"
              {...register("invoice_no")}
              error={errors.invoice_no?.message}
            />
            <Input
              label="Purchase Date"
              type="date"
              {...register("invoice_date")}
              error={errors.invoice_date?.message}
            />
            <Input
              label="Paid Amount (₹)"
              type="number"
              min={0}
              step="0.01"
              placeholder="0.00"
              {...register("paid_amount", { valueAsNumber: true })}
              error={paidAmountError}
            />
            <Input
              label="Credit Amount (₹)"
              type="number"
              min={0}
              step="0.01"
              placeholder="0.00"
              {...register("credit_amnt", { valueAsNumber: true })}
              error={creditAmountError}
            />
          </div>

          <div className="purchase-products-head">
            <div>
              <p className="text-sm font-semibold text-txt1">
                Purchased Products
              </p>
              <p className="purchase-products-hint">
                Discount and GST percentages are applied to each item.
              </p>
            </div>
            <Button
              variant="secondary"
              className="bg-white"
              type="button"
              onClick={() => openItemModal(null)}
            >
              <PlusCircle size={15} />
              Add Product
            </Button>
          </div>

          <div className="purchase-items-box">
            {items.length === 0 ? (
              <NoData message="No products added yet" className="border-none" />
            ) : (
              items.map((item, index) => (
                <div
                  key={fields[index]?.id ?? index}
                  className="purchase-item-line"
                >
                  <span className="purchase-item-line-index">{index + 1}</span>

                  <div className="purchase-item-line-info">
                    <span className="purchase-item-line-name text-truncate">
                      {item.product?.label}
                    </span>
                    <span className="purchase-item-line-sub">
                      {item.batch_no ? `Batch ${item.batch_no} · ` : ""}
                      Qty {item.quantity} × Pack {item.pack}
                      {item.discount ? ` · Disc ${item.discount}%` : ""}
                      {item.gst ? ` · GST ${item.gst}%` : ""}
                    </span>
                  </div>

                  <div className="purchase-item-line-prices">
                    <span>Buy {calc.formatCurrency(item.buy_price)}</span>
                    <span>Sell {calc.formatCurrency(item.sell_price)}</span>
                  </div>

                  <strong className="purchase-item-line-net">
                    {calc.formatCurrency(getItemNet(item))}
                  </strong>

                  <div className="purchase-item-action-btns">
                    <button
                      type="button"
                      onClick={() => openItemModal(index)}
                      className="purchase-item-edit"
                      aria-label="Edit item"
                    >
                      {/* <MdOutlineEdit size={18} /> */}
                    </button>

                    <button
                      type="button"
                      onClick={() => remove(index)}
                      className="purchase-item-remove"
                      aria-label="Remove item"
                    >
                      {/* <MdOutlineDelete size={18} /> */}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {errors.items?.message && (
            <span className="text-xs text-red">{errors.items.message}</span>
          )}

          <div className="purchase-summary">
            <div>
              <p className="text-xs font-semibold text-txt3">Credit Amount</p>
              <p className="purchase-summary-value">
                {calc.formatCurrency(creditAmount)}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-txt3">Total Amount</p>
              <p className="purchase-summary-value">
                {calc.formatCurrency(totalAmount)}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-txt3">Remaining Due</p>
              <p
                className={
                  remainingDue < 0
                    ? "purchase-summary-value-red"
                    : "purchase-summary-value-green"
                }
              >
                {calc.formatCurrency(Math.max(0, remainingDue))}
              </p>
            </div>
            <div className="purchase-summary-status">
              <p className="text-xs font-semibold text-txt3">Payment Status</p>
              <div className="purchase-summary-status-row">
                <StatusCard
                  status={paymentStatus}
                  color={
                    paymentStatus === "Paid"
                      ? "green"
                      : paymentStatus === "Partial"
                        ? "orange"
                        : "red"
                  }
                  isShow
                />
              </div>
            </div>
          </div>
        </form>

        <div className="purchase-modal-foot">
          <Button
            variant="outline"
            className="btn-round-lg"
            onClick={() => {
              reset();
              onClose();
            }}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            className="btn-round-lg"
            type="submit"
            form="purchaseForm"
            loading={isCreateLoading}
            disabled={
              isCreateLoading || paidExceedsTotal || creditExceedsItemsTotal
            }
          >
            <CircleCheck size={16} />
            Record Purchase
          </Button>
        </div>
      </div>

      {/* Nested popup: rendered after the purchase overlay so it stacks on top. */}
      {isItemModalOpen && (
        <PurchaseItemModal
          isOpen={isItemModalOpen}
          item={editingItem}
          excludeProductIds={excludedProductIds}
          loadOptions={loadProductOptions}
          onClose={closeItemModal}
          onSave={handleItemSave}
        />
      )}
    </div>
  );
}
