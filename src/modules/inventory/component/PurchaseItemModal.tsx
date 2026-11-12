import { useEffect, useMemo } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AsyncPaginate } from "react-select-async-paginate";
import type { GroupBase, OptionsOrGroups } from "react-select";
import { CircleCheck, PlusCircle } from "lucide-react";
// import { MdOutlineEdit } from "react-icons/md";
import Input from "../../../components/ui/Input";
import Button from "../../../components/ui/Button";
import CloseIcon from "../../../components/ui/CloseIcon";
import IconBox from "../../../components/ui/IconBox";
import { asyncPaginateStyle } from "../../../hooks/asyncPaginateStyle";
import { useCalculateAction } from "../../../hooks/useCalculateAction";
import { calculate, type PurchaseLine } from "../../../action/calcualtion";
import {
  defaultPurchaseItem,
  purchaseItemSchema,
  PurchaseItem,
} from "../../../api/featutres/inventryFeatures/inventrySchema/purchaseSchema";

type ProductPrice = {
  mrp?: number | string;
  buy_price?: number | string;
  sell_price?: number | string;
};

interface PurchaseItemModalProps {
  isOpen: boolean;
  /** Item being edited; omit/null to add a new line. */
  item?: PurchaseItem | null;
  /** Product ids already used by other lines, hidden from the options list. */
  excludeProductIds?: number[];
  loadOptions: (
    search: string,
    loadedOptions: OptionsOrGroups<any, GroupBase<any>>,
    additional?: { page: number },
  ) => Promise<any>;
  onClose: () => void;
  onSave: (item: PurchaseItem) => void;
}

/**
 * Net value of a purchase line, mirroring purchase.service.ts:141-152:
 * discount applies to the pre-tax line and GST is added afterwards. `pack` is
 * NOT part of the cost — buy_price is already the price per pack.
 *
 * Kept as a module-level export rather than a hook call so AddPurchase can use
 * it; the maths itself lives in `PurCal.lineNet`.
 */
export const getItemNet = (item: Partial<PurchaseItem>) =>
  calculate.purCal.lineNet(item as PurchaseLine);

export default function PurchaseItemModal({
  isOpen,
  item,
  excludeProductIds = [],
  loadOptions,
  onClose,
  onSave,
}: PurchaseItemModalProps) {
  const isEdit = Boolean(item);

  const {
    control,
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<PurchaseItem>({
    resolver: zodResolver(purchaseItemSchema) as any,
    defaultValues: defaultPurchaseItem,
  });

  // Seed the form each time the popup opens so an edit shows the stored values
  // and a fresh add starts clean.
  useEffect(() => {
    if (!isOpen) return;
    reset(item ? { ...defaultPurchaseItem, ...item } : defaultPurchaseItem);
  }, [isOpen, item, reset]);

  const watched = watch();

  const calc = useCalculateAction();

  const loadAvailableOptions = async (
    search: string,
    loadedOptions: OptionsOrGroups<any, GroupBase<any>>,
    additional?: { page: number },
  ) => {
    const result = await loadOptions(search, loadedOptions, additional);
    // const excluded = new Set(excludeProductIds);

    return {
      ...result,
      // options: result.options.filter(
      // (option: { value: number | string }) =>
      // !excluded.has(Number(option.value)),
      // ),
    };
  };

  const net = useMemo(() => getItemNet(watched), [watched]);

  if (!isOpen) return null;

  const onSubmit = (values: PurchaseItem) => {
    onSave({
      ...values,
      batch_no: values.batch_no ?? "",
      expiry_date: values.expiry_date ?? "",
      free_quantity: values.free_quantity ?? 0,
    });
  };

  return (
    <div className="modal-overlay">
      <div className="modal-panel modal-panel-lg purchase-item-modal">
        <div className="modal-header">
          <div className="modal-header-left">
            <IconBox
              // icon={
              //   isEdit ? <MdOutlineEdit size={23} /> : <PlusCircle size={23} />
              // }
              className="icon-box-lg"
            />

            <div className="flex flex-col gap-1 min-w-0">
              <h3 className="m-0 text-lg font-bold text-txt1 text-truncate">
                {isEdit ? "Edit Purchase Item" : "Add Purchase Item"}
              </h3>
              <p className="text-xs text-txt2 text-line-clamp-2">
                Pick a product and set batch, quantity and pricing for this
                line.
              </p>
            </div>
          </div>

          <CloseIcon onClose={onClose} />
        </div>

        <form className="modal-form" onSubmit={handleSubmit(onSubmit)}>
          <div className="modal-body scrollbar-hide">
            {/* Product */}
            <div className="form-field">
              <label className="form-label">Product</label>
              <Controller
                control={control}
                name="product"
                render={({ field }) => (
                  <AsyncPaginate
                    value={field.value}
                    onChange={(value) => {
                      field.onChange(value);
                      const product = value?.raw as ProductPrice | undefined;
                      if (!product) return;
                      setValue("mrp", calc.toNumber(product.mrp));
                      setValue("buy_price", calc.toNumber(product.buy_price));
                      setValue("sell_price", calc.toNumber(product.sell_price));
                    }}
                    isSearchable
                    loadOptions={loadAvailableOptions}
                    placeholder="Search & select a product"
                    styles={asyncPaginateStyle(
                      !!errors.product?.value?.message,
                    )}
                    className="w-full"
                    classNamePrefix="react-select"
                    menuPortalTarget={document.body}
                    menuPosition="fixed"
                  />
                )}
              />
              {errors?.product?.value?.message && (
                <span className="text-xs text-red">
                  {errors.product.value.message}
                </span>
              )}
            </div>

            {/* Batch / quantity / pack */}
            <div className="form-grid-4">
              <Input
                label="Batch No"
                placeholder="Optional"
                {...register("batch_no")}
              />
              <Input
                type="number"
                label="Quantity"
                min={1}
                step={1}
                placeholder="1"
                {...register("quantity", { valueAsNumber: true })}
                error={errors.quantity?.message}
              />
              <Input
                type="number"
                label="Pack Size"
                min={1}
                step={1}
                placeholder="1"
                {...register("pack", { valueAsNumber: true })}
                error={errors.pack?.message}
              />
              <Input
                type="number"
                label="Free Quantity"
                min={0}
                step={1}
                placeholder="0"
                {...register("free_quantity", { valueAsNumber: true })}
                error={(errors as any).free_quantity?.message}
              />
            </div>

            {/* Pricing */}
            <div className="form-grid-3">
              <Input
                type="number"
                label="MRP (₹)"
                min={0}
                step="0.01"
                placeholder="0.00"
                {...register("mrp", { valueAsNumber: true })}
                error={errors.mrp?.message}
              />
              <Input
                type="number"
                label="Buy Price (₹)"
                min={0}
                step="0.01"
                placeholder="0.00"
                {...register("buy_price", { valueAsNumber: true })}
                error={errors.buy_price?.message}
              />
              <Input
                type="number"
                label="Sell Price (₹)"
                min={0}
                step="0.01"
                placeholder="0.00"
                {...register("sell_price", { valueAsNumber: true })}
                error={errors.sell_price?.message}
              />
            </div>

            {/* Discount / GST / expiry */}
            <div className="form-grid-3">
              <Input
                type="number"
                label="Discount (%)"
                min={0}
                step="0.01"
                placeholder="0"
                {...register("discount", { valueAsNumber: true })}
                error={errors.discount?.message}
              />
              <Input
                type="number"
                label="GST (%)"
                min={0}
                step="0.01"
                placeholder="0"
                {...register("gst", { valueAsNumber: true })}
                error={errors.gst?.message}
              />
              <Input
                type="date"
                label="Expiry Date"
                {...register("expiry_date")}
                error={errors.expiry_date?.message}
              />
            </div>

            <div className="purchase-item-net">
              <span className="text-xs font-semibold text-txt3">Item Net</span>
              <strong>{calc.formatCurrency(net)}</strong>
            </div>
          </div>

          <div className="modal-footer">
            <Button
              variant="outline"
              className="modal-footer-btn"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button type="submit" className="modal-footer-btn">
              <CircleCheck size={18} />
              {isEdit ? "Update Item" : "Add Item"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
