import { useEffect, useMemo, useRef, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ChevronDown,
  History,
  Package,
  Plus,
  Save,
  Trash2,
  User,
} from "lucide-react";
// import { BsCurrencyRupee } from "react-icons/bs";
// import { FaUserAlt } from "react-icons/fa";
// import {
//   MdDiscount,
//   MdEmail,
//   MdLocalPhone,
//   MdOutlineInventory2,
//   MdOutlinePercent,
// } from "react-icons/md";

import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import NoData from "../../../components/table/noData";
import StatusCard from "../../../components/ui/StatusCard";
import CircleLoader from "../../../components/ui/CircleLoader";
import IconBox from "../../../components/ui/IconBox";
import CloseIcon from "../../../components/ui/CloseIcon";
import { SectionTitle } from "../../quotation/component/SectionTitle";
import { setToastMessage } from "../../../helper/helper";
import { useCalculateAction } from "../../../hooks/useCalculateAction";
import { useGetShopQuery } from "../../../api/featutres/shopFeatures/shopApi";
import type { BillLine } from "../../../action/calcualtion";
import {
  useCreatePickupOrderMutation,
  useGetPickupOrderByIdQuery,
  useUpdatePickupOrderMutation,
} from "../../../api/featutres/orderFeatures/pickupOrderApi";
import {
  defaultPickupOrder,
  pickupOrderSchema,
  type PickupOrderForm,
} from "../../../api/featutres/orderFeatures/pickupOrderSchema";
import PickupOrderItemModal, {
  type PickupOrderLine,
} from "./PickupOrderItemModal";

const DISCOUNT_OPTIONS = [
  { value: "none", label: "None" },
  { value: "percentage", label: "Percentage" },
  { value: "amount", label: "Amount" },
] as const;

const TAX_OPTIONS = [
  { value: "none", label: "None" },
  { value: "percentage", label: "Tax Percentage" },
] as const;

interface PickupOrderFormModalProps {
  isOpen: boolean;
  /** Order being edited; omit/null to create a new one. */
  orderId?: number | null;
  onClose: () => void;
  onSaved?: () => void;
}

const toLines = (items: any[] = []): PickupOrderLine[] =>
  items.map((item) => ({
    productId: item.productId,
    stockId: item.stockId,
    product_name: item.product_name ?? `Product #${item.productId}`,
    batch_no: item.batch_no ?? undefined,
    quantity: Number(item.quantity ?? 0),
    price: Number(item.price ?? 0),
    gst: Number(item.gst ?? 0),
  }));

/**
 * Create / edit a pickup order.
 *
 * Stock is not touched here: the order only reserves the lines, and the batch
 * quantity is deducted later when the order is marked as delivered.
 */
export default function PickupOrderFormModal({
  isOpen,
  orderId,
  onClose,
  onSaved,
}: PickupOrderFormModalProps) {
  const calc = useCalculateAction();
  const isEdit = Boolean(orderId);

  // GST is only charged (and only shown) when the shop master switch is on.
  const { data: shopdata } = useGetShopQuery({ gst: true });
  const shopGstOn = Boolean(shopdata?.shop?.gst);

  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  // Discount / Tax pickers — same popover controls as the invoice screen.
  const [isDiscountOpen, setIsDiscountOpen] = useState(false);
  const discountWrapRef = useRef<HTMLDivElement>(null);
  const [isTaxOpen, setIsTaxOpen] = useState(false);
  const taxWrapRef = useRef<HTMLDivElement>(null);
  const [discountType, setDiscountType] = useState<
    "none" | "percentage" | "amount"
  >("none");
  const [discount, setDiscount] = useState(0);
  const [taxType, setTaxType] = useState<"none" | "percentage">("none");
  const [taxInput, setTaxInput] = useState(0);

  const { data, isFetching } = useGetPickupOrderByIdQuery(orderId as number, {
    skip: !isOpen || !orderId,
  });
  const order = data?.order;

  const {
    control,
    handleSubmit,
    reset,
    register,
    getValues,
    watch,
    formState: { errors },
  } = useForm<PickupOrderForm>({
    resolver: zodResolver(pickupOrderSchema) as any,
    defaultValues: defaultPickupOrder,
  });

  const { fields, append, remove, update } = useFieldArray({
    control,
    name: "items",
  });

  const [createPickupOrder, { isLoading: isCreating }] =
    useCreatePickupOrderMutation();
  const [updatePickupOrder, { isLoading: isUpdating }] =
    useUpdatePickupOrderMutation();
  const isSaving = isCreating || isUpdating;

  // Seed the form each time the popup opens, or once the order detail lands.
  useEffect(() => {
    if (!isOpen) return;

    if (!orderId) {
      reset(defaultPickupOrder);
      setDiscountType("none");
      setDiscount(0);
      setTaxType("none");
      setTaxInput(0);
      return;
    }

    if (order) {
      reset({
        customerName: order.patient_name ?? "",
        doctorName: order.doctor_name ?? "",
        phone_no: order.phone_number ?? "",
        email: order.email ?? "",
        address: order.address ?? "",
        items: toLines(order.items ?? []),
      });
      setDiscountType(order.discount_type ?? "none");
      setDiscount(order.discount != null ? calc.toNumber(order.discount) : 0);
      const firstGst = order.items?.[0]?.gst;
      setTaxType(firstGst > 0 ? "percentage" : "none");
      setTaxInput(firstGst > 0 ? calc.toNumber(firstGst) : 0);
    }
  }, [isOpen, orderId, order, reset, calc]);

  const watchedItems = watch("items");
  const totalPieces = useMemo(
    () =>
      (watchedItems ?? []).reduce(
        (sum, item) => sum + calc.toNumber(item?.quantity),
        0,
      ),
    [watchedItems, calc],
  );

  // Close the discount popover on any outside click / Escape.
  useEffect(() => {
    if (!isDiscountOpen) return;

    const onClick = (event: MouseEvent) => {
      if (
        discountWrapRef.current &&
        !discountWrapRef.current.contains(event.target as Node)
      ) {
        setIsDiscountOpen(false);
      }
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsDiscountOpen(false);
    };

    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [isDiscountOpen]);

  // Same outside-click behaviour for the tax popover.
  useEffect(() => {
    if (!isTaxOpen) return;

    const onClick = (event: MouseEvent) => {
      if (
        taxWrapRef.current &&
        !taxWrapRef.current.contains(event.target as Node)
      ) {
        setIsTaxOpen(false);
      }
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsTaxOpen(false);
    };

    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [isTaxOpen]);

  // One tax rate covers the whole order; the shop master switch wins — when
  // GST is off on the shop, no document may charge tax.
  const isTaxed = calc.tax.shouldCharge({
    enabled: taxType === "percentage",
    shopEnabled: shopGstOn,
  });
  const viewGstPct = isTaxed ? taxInput : 0;
  const hasDiscount = calc.discount.hasDiscount(discountType, discount);

  const { subtotal, gstAmount, discountAmount, finalAmount } =
    calc.invCal.totals((watchedItems ?? []) as unknown as BillLine[], {
      gstPercentage: viewGstPct,
      enabled: isTaxed,
      discountType,
      discount,
    });

  if (!isOpen) return null;

  const openAddItem = () => {
    setEditingIndex(null);
    setIsItemModalOpen(true);
  };

  const openEditItem = (index: number) => {
    setEditingIndex(index);
    setIsItemModalOpen(true);
  };

  const handleSaveItem = (line: PickupOrderLine) => {
    if (editingIndex !== null) {
      update(editingIndex, line);
      setIsItemModalOpen(false);
      return;
    }

    // Merge lines that target the same batch so a batch is never over-drawn
    // by two separate rows.
    const existingIndex = (getValues("items") ?? []).findIndex(
      (item) =>
        item.productId === line.productId && item.stockId === line.stockId,
    );

    if (existingIndex > -1) {
      const existing = getValues("items")[existingIndex];
      update(existingIndex, {
        ...existing,
        quantity: calc.toNumber(existing.quantity) + line.quantity,
      });
    } else {
      append(line);
    }

    setIsItemModalOpen(false);
  };

  const onSubmit = async (payload: PickupOrderForm) => {
    const body = {
      patient_name: payload.customerName.trim(),
      doctor_name: payload.doctorName?.trim() || undefined,
      phone_number: payload.phone_no?.trim() || undefined,
      email: payload.email?.trim() || undefined,
      address: payload.address?.trim() || undefined,
      ...(hasDiscount && {
        discount_type: discountType,
        discount: calc.toNumber(discount),
      }),
      items: payload.items.map((item) => ({
        productId: item.productId,
        stockId: item.stockId,
        quantity: item.quantity,
        price: item.price,
        gst: isTaxed ? taxInput : 0,
      })),
    };

    try {
      const res: any = isEdit
        ? await updatePickupOrder({ id: orderId, data: body }).unwrap()
        : await createPickupOrder(body).unwrap();

      if (res?.success) {
        setToastMessage(
          "success",
          res?.message || `Pickup order ${isEdit ? "updated" : "created"}`,
        );
        reset(defaultPickupOrder);
        onSaved?.();
        onClose();
      }
    } catch (error: any) {
      // A 401 is already handled globally (toast + redirect to login).
      if (error?.status === 401) return;
      setToastMessage(
        "error",
        error?.data?.message ||
          `Failed to ${isEdit ? "update" : "create"} pickup order`,
      );
    }
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
            <IconBox icon={<Package size={23} />} className="icon-box-lg" />
            <div className="flex flex-col gap-1 min-w-0">
              <h3 className="m-0 text-lg font-bold text-txt1 text-truncate">
                {isEdit ? "Edit Pickup Order" : "New Pickup Order"}
              </h3>
              <p className="text-xs text-txt2">
                Reserve the items for a customer to collect. Stock is deducted
                only when the order is marked as delivered.
              </p>
            </div>
          </div>

          <CloseIcon onClose={onClose} />
        </div>

        {isEdit && isFetching && !order ? (
          <div className="modal-body">
            <CircleLoader loadingText="Loading order…" />
          </div>
        ) : (
          <form className="modal-form" onSubmit={handleSubmit(onSubmit)}>
            <div className="modal-body scrollbar-hide">
              <div className="invoice-section-box">
                <SectionTitle
                  icon={<User size={18} />}
                  title="Customer Details"
                />

                <div className="invoice-field-grid">
                  <Input
                    label="Customer Name (Required)"
                    placeholder="e.g. Anusha S"
                    maxLength={200}
                    labelClassName="text-xs font-medium"
                    className="bg-white"
                    // icon={<FaUserAlt size={10} />}
                    error={errors.customerName?.message}
                    {...register("customerName")}
                  />
                  <Input
                    label="Doctor Name (Optional)"
                    placeholder="e.g. Dr. Raj Kumar"
                    maxLength={200}
                    labelClassName="text-xs font-medium"
                    className="bg-white"
                    // icon={<FaUserAlt size={10} />}
                    error={errors.doctorName?.message}
                    {...register("doctorName")}
                  />
                  <Input
                    label="Phone Number (Required)"
                    type="number"
                    placeholder="e.g. 9876543210"
                    maxLength={50}
                    labelClassName="text-xs font-medium"
                    className="bg-white"
                    // icon={<MdLocalPhone size={15} />}
                    error={errors.phone_no?.message}
                    {...register("phone_no")}
                  />
                  <Input
                    label="Email (Optional)"
                    placeholder="e.g. example@gmail.com"
                    maxLength={100}
                    labelClassName="text-xs font-medium"
                    className="bg-white"
                    // icon={<MdEmail size={15} />}
                    error={errors.email?.message}
                    {...register("email")}
                  />
                  <div className="flex flex-col gap-1">
                    <label className="form-label text-xs font-medium">
                      Address (Optional)
                    </label>
                    <textarea
                      className="form-textarea"
                      placeholder="e.g. 35/111-A, Court Road, Thuckalay"
                      rows={3}
                      maxLength={500}
                      {...register("address")}
                    />
                    {errors.address?.message && (
                      <span className="text-xs text-red">
                        {errors.address.message}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="invoice-section-box">
                <div className="flex items-center justify-between gap-3">
                  <SectionTitle
                    // icon={<MdOutlineInventory2 size={18} />}
                    title="Order Items"
                  />
                  <StatusCard
                    status={`${fields.length} Items · ${totalPieces} Pcs`}
                    color="blue"
                    isShow
                  />
                </div>

                <div className="invoice-actions-row">
                  <Button
                    type="button"
                    className="flex-1"
                    onClick={openAddItem}
                  >
                    <Plus size={18} />
                    Add Order Item
                  </Button>

                  <div className="invoice-discount-wrap" ref={discountWrapRef}>
                    <Button
                      type="button"
                      variant="outline"
                      className={
                        discountType === "none"
                          ? "invoice-discount-btn"
                          : "invoice-discount-btn invoice-discount-btn-active"
                      }
                      aria-expanded={isDiscountOpen}
                      aria-haspopup="dialog"
                      onClick={() => setIsDiscountOpen((prev) => !prev)}
                    >
                      {/* <MdDiscount size={16} /> */}
                      {discountType === "percentage"
                        ? `${discount}%`
                        : discountType === "amount"
                          ? `₹${discount}`
                          : "Discount"}
                      <ChevronDown
                        size={14}
                        className={
                          isDiscountOpen ? "invoice-discount-caret-open" : ""
                        }
                      />
                    </Button>

                    {isDiscountOpen && (
                      <div className="invoice-discount-pop" role="dialog">
                        <div className="invoice-discount-pop-head">
                          Discount
                        </div>

                        <div className="invoice-discount-opts">
                          {DISCOUNT_OPTIONS.map((option) => (
                            <button
                              key={option.value}
                              type="button"
                              className={
                                discountType === option.value
                                  ? "invoice-discount-opt invoice-discount-opt-active"
                                  : "invoice-discount-opt"
                              }
                              onClick={() => {
                                setDiscountType(option.value);
                                if (option.value === "none") {
                                  setDiscount(0);
                                  setIsDiscountOpen(false);
                                }
                              }}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>

                        {discountType !== "none" && (
                          <div className="invoice-discount-value">
                            <Input
                              label={
                                discountType === "percentage"
                                  ? "Percentage (%)"
                                  : "Amount (₹)"
                              }
                              type="number"
                              min={0}
                              max={
                                discountType === "percentage" ? 100 : undefined
                              }
                              step={discountType === "percentage" ? 0.5 : 1}
                              labelClassName="text-xs font-medium"
                              placeholder={
                                discountType === "percentage"
                                  ? "e.g. 10"
                                  : "e.g. 250"
                              }
                              className="bg-white"
                              // icon={
                              //   discountType === "percentage" ? (
                              //     <MdOutlinePercent size={15} />
                              //   ) : (
                              //     <BsCurrencyRupee size={15} />
                              //   )
                              // }
                              value={discount}
                              onChange={(e) =>
                                setDiscount(Number(e.target.value))
                              }
                            />

                            <span className="invoice-discount-hint">
                              Saves {calc.formatCurrency(discountAmount)} · New
                              total {calc.formatCurrency(finalAmount)}
                            </span>

                            <Button
                              type="button"
                              className="w-full"
                              onClick={() => setIsDiscountOpen(false)}
                            >
                              Done
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div
                    className="invoice-discount-wrap"
                    ref={taxWrapRef}
                    style={shopGstOn ? undefined : { display: "none" }}
                  >
                    <Button
                      type="button"
                      variant="outline"
                      className={
                        isTaxed
                          ? "invoice-discount-btn invoice-discount-btn-active"
                          : "invoice-discount-btn"
                      }
                      aria-expanded={isTaxOpen}
                      aria-haspopup="dialog"
                      onClick={() => setIsTaxOpen((prev) => !prev)}
                    >
                      {/* <MdOutlinePercent size={16} /> */}
                      {isTaxed ? `Tax ${taxInput}%` : "Tax"}
                      <ChevronDown
                        size={14}
                        className={
                          isTaxOpen ? "invoice-discount-caret-open" : ""
                        }
                      />
                    </Button>

                    {isTaxOpen && (
                      <div className="invoice-discount-pop" role="dialog">
                        <div className="invoice-discount-pop-head">Tax</div>

                        <div className="invoice-discount-opts">
                          {TAX_OPTIONS.map((option) => (
                            <button
                              key={option.value}
                              type="button"
                              className={
                                taxType === option.value
                                  ? "invoice-discount-opt invoice-discount-opt-active"
                                  : "invoice-discount-opt"
                              }
                              onClick={() => {
                                setTaxType(option.value);
                                if (option.value === "none") {
                                  setTaxInput(0);
                                  setIsTaxOpen(false);
                                }
                              }}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>

                        {isTaxed && (
                          <div className="invoice-discount-value">
                            <Input
                              label="Tax Percentage (%)"
                              type="number"
                              min={0}
                              max={100}
                              step={0.5}
                              labelClassName="text-xs font-medium"
                              placeholder="e.g. 18"
                              className="bg-white"
                              // icon={<MdOutlinePercent size={15} />}
                              value={taxInput}
                              onChange={(e) =>
                                setTaxInput(Number(e.target.value))
                              }
                            />

                            <span className="invoice-discount-hint">
                              Adds {calc.formatCurrency(gstAmount)} · New total{" "}
                              {calc.formatCurrency(finalAmount)}
                            </span>

                            <Button
                              type="button"
                              className="w-full"
                              onClick={() => setIsTaxOpen(false)}
                            >
                              Done
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {fields.length > 0 ? (
                  <div className="invoice-item-list">
                    {fields.map((field, index) => {
                      const totals = calc.invCal.lineTotals({
                        ...field,
                        gst: viewGstPct,
                      } as unknown as BillLine);
                      return (
                        <div key={field.id} className="invoice-item-row">
                          <div className="flex items-center flex-1 gap-3 min-w-0">
                            <span className="invoice-item-index">
                              {index + 1}
                            </span>
                            <div className="flex flex-col gap-1 flex-1 min-w-0">
                              <span className="text-sm font-medium text-truncate">
                                {field.product_name}
                              </span>
                              <span className="text-xs font-medium text-txt3">
                                {field.batch_no && (
                                  <span className="invoice-item-sn">
                                    Batch: {field.batch_no}
                                  </span>
                                )}
                                {field.quantity} pcs ×{" "}
                                {calc.formatCurrency(field.price)}
                                {isTaxed && <> · GST {viewGstPct}%</>}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-txt1 whitespace-nowrap">
                              {calc.formatCurrency(totals.total)}
                            </span>
                            <button
                              type="button"
                              onClick={() => openEditItem(index)}
                              className="invoice-item-edit"
                              disabled={isSaving}
                            >
                              {/* <MdOutlineInventory2 size={16} /> */}
                            </button>
                            <button
                              type="button"
                              onClick={() => remove(index)}
                              className="invoice-item-remove"
                              disabled={isSaving}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <NoData message="No order items added yet." />
                )}

                {errors.items?.message && (
                  <span className="form-error">{errors.items.message}</span>
                )}

                {fields.length > 0 && (
                  <div className="orders-summary">
                    <div className="orders-summary-row">
                      <span>Subtotal</span>
                      <strong>{calc.formatCurrency(subtotal)}</strong>
                    </div>

                    {isTaxed && (
                      <div className="orders-summary-row">
                        <span>Tax (GST)</span>
                        <strong>{calc.formatCurrency(gstAmount)}</strong>
                      </div>
                    )}

                    {discountAmount > 0 && (
                      <div className="orders-summary-row">
                        <span>Discount</span>
                        <strong>- {calc.formatCurrency(discountAmount)}</strong>
                      </div>
                    )}

                    <div className="orders-summary-row orders-summary-row-total">
                      <span>Order Total</span>
                      <strong>{calc.formatCurrency(finalAmount)}</strong>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <Button
                type="button"
                variant="outline"
                className="modal-footer-btn"
                onClick={onClose}
              >
                <History size={18} />
                Cancel
              </Button>
              <Button
                type="submit"
                className="modal-footer-btn"
                loading={isSaving}
                disabled={isSaving || fields.length === 0}
              >
                <Save size={18} />
                {isEdit ? "Update Order" : "Create Order"}
              </Button>
            </div>
          </form>
        )}
      </div>

      {isItemModalOpen && (
        <PickupOrderItemModal
          isOpen={isItemModalOpen}
          item={
            editingIndex !== null
              ? (getValues("items")[editingIndex] as unknown as PickupOrderLine)
              : null
          }
          onClose={() => setIsItemModalOpen(false)}
          onSave={handleSaveItem}
        />
      )}
    </div>
  );
}
