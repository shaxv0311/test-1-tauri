import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Controller, useForm } from "react-hook-form";
import { AsyncPaginate } from "react-select-async-paginate";
import {
  History,
  Package,
  Plus,
  RefreshCw,
  Trash2,
  Truck,
  Undo2,
  User,
} from "lucide-react";
// import { MdOutlineInventory2 } from "react-icons/md";

import Button from "../../../components/ui/Button";
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
import { useSupplierLoader } from "../../inventory/hooks/useSupplierLoader";
import { useLazyGetSuppliersQuery } from "../../../api/featutres/inventryFeatures/inventryApi/brandCategorySupplierApi";
import { useLazyGetproductsQuery } from "../../../api/featutres/inventryFeatures/inventryApi/productApi";
import { useCreatePurchaseReturnMutation } from "../../../api/featutres/purchaseReturnFeatures/purchaseReturnApi";
import PurchaseReturnItemModal, {
  type PurchaseReturnLine,
} from "../component/PurchaseReturnItemModal";

export default function PurchaseReturn() {
  const navigate = useNavigate();
  const calc = useCalculateAction();

  const [triggerGetProducts] = useLazyGetproductsQuery();
  const { loadProductOptions } = useProductLoader(triggerGetProducts);

  const [triggerGetSuppliers] = useLazyGetSuppliersQuery();
  const { loadSupplierOptions } = useSupplierLoader(triggerGetSuppliers);

  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  // Lines live here rather than in a field array: the API treats them as a flat
  // list and there is no per-line field validation to bind to.
  const [items, setItems] = useState<PurchaseReturnLine[]>([]);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<{ supplier: { value: number; label: string } | null }>({
    defaultValues: { supplier: null },
  });

  const [createPurchaseReturn, { isLoading: isSaving }] =
    useCreatePurchaseReturnMutation();

  const openAddItem = () => {
    setEditingIndex(null);
    setIsItemModalOpen(true);
  };

  const openEditItem = (index: number) => {
    setEditingIndex(index);
    setIsItemModalOpen(true);
  };

  const closeItemModal = () => {
    setIsItemModalOpen(false);
    setEditingIndex(null);
  };

  const handleSaveItem = (line: PurchaseReturnLine) => {
    setItems((current) => {
      if (editingIndex === null) return [...current, line];

      const next = [...current];
      next[editingIndex] = line;
      return next;
    });
    closeItemModal();
  };

  const handleRemoveItem = (index: number) => {
    setItems((current) => current.filter((_, i) => i !== index));
  };

  const editingItem =
    editingIndex !== null ? (items[editingIndex] ?? null) : null;

  // Mirrors the piece count the API stores on the batch.
  const totalPacks = useMemo(
    () =>
      items.reduce(
        (sum, line) =>
          sum + Math.max(0, Math.round(calc.toNumber(line.quantity))),
        0,
      ),
    [items, calc],
  );

  const totalPieces = useMemo(
    () =>
      items.reduce((sum, line) => {
        const pack = Math.max(1, Math.round(calc.toNumber(line.pack)));
        const quantity = Math.max(0, Math.round(calc.toNumber(line.quantity)));
        return sum + pack * quantity;
      }, 0),
    [items, calc],
  );

  const onSubmit = async ({
    supplier,
  }: {
    supplier: SupplierOption | null;
  }) => {
    const supplierId = supplier?.value;

    // The API rejects unknown fields, so only the ids the schema declares are
    // sent — the return number and user are assigned server-side.
    const body = {
      ...(supplierId ? { supplierId } : {}),
      replacementItems: items.map((line) => ({
        productId: line.productId,
        pack: Math.round(line.pack),
        quantity: Math.round(line.quantity),
        ...(line.batch_no ? { batch_no: line.batch_no } : {}),
        ...(line.expiry_date ? { expiry_date: line.expiry_date } : {}),
      })),
    };

    if (body.replacementItems.length === 0) {
      setToastMessage("error", "Add at least one replacement item");
      return;
    }

    try {
      const res: any = await createPurchaseReturn(body).unwrap();

      if (res?.success) {
        setToastMessage(
          "success",
          res?.message ||
            "Purchase return created and stock updated successfully",
        );
        reset({ supplier: null });
        setItems([]);
      }
    } catch (error: any) {
      // A 401 is already handled globally (toast + redirect to login).
      if (error?.status === 401) return;
      setToastMessage(
        "error",
        error?.data?.message || "Failed to create purchase return",
      );
    }
  };

  return (
    <div className="section-body gap-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 shrink-0">
        <SectionTitle icon={<Undo2 size={20} />} title="New Purchase Return" />

        <div className="flex items-center gap-4">
          <StatusCard
            status={`${items.length} Items · ${totalPacks} Packs · ${totalPieces} Pcs`}
            color="blue"
            isShow
          />
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
          <div className="invoice-section-box">
            <SectionTitle icon={<User size={18} />} title="Supplier" />

            <div className="invoice-item-grid">
              <div className="form-field">
                <label className="form-label">
                  Supplier{" "}
                  <span className="form-label-optional">(optional)</span>
                </label>
                <Controller
                  control={control}
                  name="supplier"
                  render={({ field }) => (
                    <AsyncPaginate
                      value={field.value}
                      onChange={(value) =>
                        field.onChange(
                          value
                            ? {
                                value: Number((value as any).value),
                                label: String((value as any).label),
                              }
                            : null,
                        )
                      }
                      isSearchable
                      isClearable
                      loadOptions={loadSupplierOptions}
                      placeholder="Search & select a supplier…"
                      styles={asyncPaginateStyle(false)}
                      menuPortalTarget={selectMenuPortalTarget()}
                      additional={{ page: 1 }}
                    />
                  )}
                />
                {errors?.supplier?.message && (
                  <span className="form-error">{errors.supplier.message}</span>
                )}
              </div>
            </div>
          </div>

          <div className="invoice-section-box">
            <SectionTitle
              // icon={<MdOutlineInventory2 size={18} />}
              title="Replacement Items Received"
            />

            {/* Only the replacement is recorded — the damaged goods handed back
                to the supplier are not tracked by the API. */}
            <div className="sales-return-note">
              <Package size={16} className="shrink-0" />
              <span>
                Add the stock the supplier sent back. Stock increases as soon as
                the return is saved, and an existing batch is topped up when the
                batch no matches.
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="button"
                className="w-full sm-w-auto"
                onClick={openAddItem}
              >
                <Plus size={18} />
                Add Replacement Item
              </Button>
            </div>

            {items.length > 0 ? (
              <div className="invoice-item-list">
                {items.map((line, index) => (
                  <div
                    key={`${line.productId}-${index}`}
                    className="invoice-item-row"
                  >
                    <div className="flex items-center flex-1 gap-3">
                      <span className="invoice-item-index">{index + 1}</span>
                      <div className="flex flex-col gap-1 flex-1">
                        <span className="text-sm font-medium text-truncate">
                          {line.product?.label ?? `Product #${line.productId}`}
                        </span>
                        <span className="text-xs font-medium text-txt3">
                          {line.batch_no && (
                            <span className="invoice-item-sn">
                              Batch: {line.batch_no}
                            </span>
                          )}
                          {line.pack} pack × {line.quantity} ={" "}
                          {line.pack * line.quantity} pcs
                          {line.expiry_date && ` · Exp ${line.expiry_date}`}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="invoice-item-edit"
                        title="Edit item"
                        aria-label="Edit item"
                        disabled={isSaving}
                        onClick={() => openEditItem(index)}
                      >
                        <RefreshCw size={16} />
                      </button>
                      <button
                        type="button"
                        className="invoice-item-remove"
                        title="Remove item"
                        aria-label="Remove item"
                        disabled={isSaving}
                        onClick={() => handleRemoveItem(index)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <NoData message="No replacement items added yet." />
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="submit"
              className="invoice-submit-btn w-full sm-w-auto"
              loading={isSaving}
              disabled={isSaving || items.length === 0}
            >
              <Truck size={18} />
              Save Purchase Return
            </Button>

            <Button
              type="button"
              variant="outline"
              className="w-full sm-w-auto"
              onClick={() => navigate(ROUTES.RETURNS.PURCHASE_RETURN_HISTORY)}
            >
              <History size={18} />
              View History
            </Button>
          </div>
        </form>
      </div>

      <PurchaseReturnItemModal
        isOpen={isItemModalOpen}
        item={editingItem}
        loadOptions={loadProductOptions}
        onClose={closeItemModal}
        onSave={handleSaveItem}
      />
    </div>
  );
}

interface SupplierOption {
  value: number;
  label: string;
}
