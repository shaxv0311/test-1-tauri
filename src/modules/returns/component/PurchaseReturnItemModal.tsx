import { useEffect, useMemo } from "react";
import { Controller, useForm } from "react-hook-form";
import { AsyncPaginate } from "react-select-async-paginate";
import type { GroupBase, OptionsOrGroups } from "react-select";
import { CircleCheck, PlusCircle } from "lucide-react";
// import { MdOutlineEdit } from "react-icons/md";

import Input from "../../../components/ui/Input";
import Button from "../../../components/ui/Button";
import CloseIcon from "../../../components/ui/CloseIcon";
import IconBox from "../../../components/ui/IconBox";
import { asyncPaginateStyle } from "../../../hooks/asyncPaginateStyle";

/** The line as the parent page holds it, plus the select option. */
export interface PurchaseReturnLine {
  productId: number;
  product: { value: number; label: string } | null;
  batch_no: string;
  pack: number;
  quantity: number;
  expiry_date: string;
}

interface PurchaseReturnItemModalProps {
  isOpen: boolean;
  /** Line being edited; omit/null to add a new one. */
  item?: PurchaseReturnLine | null;
  loadOptions: (
    search: string,
    loadedOptions: OptionsOrGroups<any, GroupBase<any>>,
    additional?: { page: number },
  ) => Promise<any>;
  onClose: () => void;
  onSave: (item: PurchaseReturnLine) => void;
}

const defaultLine: PurchaseReturnLine = {
  productId: 0,
  product: null,
  batch_no: "",
  pack: 1,
  quantity: 1,
  expiry_date: "",
};

/**
 * A single "replacement received" line on a purchase return.
 *
 * There is no batch picker here on purpose: the API resolves the batch from
 * `batch_no`, topping up a matching batch or creating a new one. Leaving it
 * blank is valid and creates a batch-less row.
 */
export default function PurchaseReturnItemModal({
  isOpen,
  item,
  loadOptions,
  onClose,
  onSave,
}: PurchaseReturnItemModalProps) {
  const isEdit = Boolean(item);

  const {
    control,
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<PurchaseReturnLine>({
    defaultValues: defaultLine,
  });

  // Seed the form each time the popup opens so an edit shows the stored values
  // and a fresh add starts clean. Validation is done by the page on submit, so
  // there is no resolver here — the popup just refuses to save an empty
  // product.
  useEffect(() => {
    if (!isOpen) return;
    reset(item ? { ...item } : { ...defaultLine });
  }, [isOpen, item, reset]);

  const watched = watch();

  // Makes the pack conversion auditable instead of a black box: the API stores
  // `pack × quantity` as the piece count on the batch.
  const pieces = useMemo(() => {
    const pack = Number(watched?.pack);
    const quantity = Number(watched?.quantity);
    if (!Number.isFinite(pack) || pack < 1) return 0;
    if (!Number.isFinite(quantity) || quantity < 0) return 0;
    return Math.round(pack * quantity);
  }, [watched]);

  if (!isOpen) return null;

  const onSubmit = () => {
    const productId = Number(watched?.product?.value);
    if (!Number.isFinite(productId) || productId < 1) return;

    const pack = Math.round(Number(watched?.pack));
    const quantity = Math.round(Number(watched?.quantity));
    if (!Number.isInteger(pack) || pack < 1) return;
    if (!Number.isInteger(quantity) || quantity < 1) return;

    onSave({
      productId,
      product: watched.product,
      batch_no: String(watched?.batch_no ?? "").trim(),
      pack,
      quantity,
      expiry_date: String(watched?.expiry_date ?? ""),
    });
  };

  const productError = !watched?.product?.value;

  return (
    <div className="modal-overlay">
      <div className="modal-panel modal-panel-lg purchase-item-modal">
        <div className="modal-header">
          <div className="modal-header-left">
            {/* <IconBox
              icon={
                isEdit ? <MdOutlineEdit size={23} /> : <PlusCircle size={23} />
              }
              className="icon-box-lg"
            /> */}

            <div className="flex flex-col gap-1 min-w-0">
              <h3 className="m-0 text-lg font-bold text-txt1 text-truncate">
                {isEdit ? "Edit Replacement Item" : "Add Replacement Item"}
              </h3>
              <p className="text-xs text-txt2 text-line-clamp-2">
                Stock received back from the supplier. An existing batch is
                topped up when the batch no matches.
              </p>
            </div>
          </div>

          <CloseIcon onClose={onClose} />
        </div>

        <form className="modal-form" onSubmit={handleSubmit(onSubmit)}>
          <div className="modal-body scrollbar-hide">
            <div className="form-field">
              <label className="form-label">Product</label>
              <Controller
                control={control}
                name="product"
                render={({ field }) => (
                  <AsyncPaginate
                    value={field.value}
                    onChange={field.onChange}
                    isSearchable
                    loadOptions={loadOptions}
                    placeholder="Search & select a product"
                    styles={asyncPaginateStyle(productError)}
                    className="w-full"
                    classNamePrefix="react-select"
                    menuPortalTarget={document.body}
                    menuPosition="fixed"
                  />
                )}
              />
              {productError && (
                <span className="text-xs text-red">Product is required</span>
              )}
            </div>

            <div className="form-grid-3">
              <Input
                label="Batch No"
                placeholder="Optional"
                {...register("batch_no")}
                error={errors.batch_no?.message}
              />
              <Input
                type="number"
                label="Quantity (packs)"
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
            </div>

            <div className="form-grid-3">
              <Input
                type="date"
                label="Expiry Date"
                {...register("expiry_date")}
                error={errors.expiry_date?.message}
              />
            </div>

            <div className="purchase-item-net">
              <span className="text-xs font-semibold text-txt3">
                Total Pieces Received
              </span>
              <strong>{pieces}</strong>
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
