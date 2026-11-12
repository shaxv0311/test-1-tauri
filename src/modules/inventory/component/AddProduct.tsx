import { CircleCheck, PlusCircle, Trash2 } from "lucide-react";
import Input from "../../../components/ui/Input";
import StatusToggleCard from "../../../components/ui/StatusToggleCard";
import CloseIcon from "../../../components/ui/CloseIcon";
import Button from "../../../components/ui/Button";
// import { MdAddShoppingCart } from "react-icons/md";
import { ModalProps } from "../../../utils/type";
import IconBox from "../../../components/ui/IconBox";
import {
  useCreateProductMutation,
  useGetProductsByIdQuery,
  useUpdateProductMutation,
} from "../../../api/featutres/inventryFeatures/inventryApi/productApi";
import {
  useGetBrandsQuery,
  useGetCategoriesQuery,
  useLazyGetBrandsQuery,
  useLazyGetCategoriesQuery,
} from "../../../api/featutres/inventryFeatures/inventryApi/brandCategorySupplierApi";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import {
  defaultProduct,
  defaultStockBatch,
  ProductForm,
  productSchema,
} from "../../../api/featutres/inventryFeatures/inventrySchema/productSchema";
import { zodResolver } from "@hookform/resolvers/zod";
import { setToastMessage } from "../../../helper/helper";
import { AsyncPaginate } from "react-select-async-paginate";
import { useCategoryLoader } from "../hooks/useCategoryLoader";
import { asyncPaginateStyle } from "../../../hooks/asyncPaginateStyle";
import { useBrandLoader } from "../hooks/useBrandLoader";
import { useEffect, useState } from "react";
import StatusCard from "../../../components/ui/StatusCard";
import { getStockStatusMeta } from "../../../helper/stockStatus";
import AddCategory from "./AddCategory";
import AddBrand from "./AddBrand";

const toNumber = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const roundCurrency = (value: unknown) =>
  Math.round(toNumber(value) * 100) / 100;

export default function AddProduct({ onClose, isOpen, data }: ModalProps) {
  const isEdit = Boolean(data?.id);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isBrandModalOpen, setIsBrandModalOpen] = useState(false);
  const [categoryVersion, setCategoryVersion] = useState(0);
  const [brandVersion, setBrandVersion] = useState(0);

  const { data: product } = useGetProductsByIdQuery(data?.id, {
    skip: !data?.id,
  });

  const categoryName = product?.product?.category_name as string | undefined;
  const brandName = product?.product?.brand_name as string | undefined;
  const lookupFilter = { page: 1, limit: 100, search: "" };

  const { data: categoryList, isLoading: areCategoriesLoading } =
    useGetCategoriesQuery(lookupFilter, { skip: !isEdit });

  const { data: brandList, isLoading: areBrandsLoading } = useGetBrandsQuery(
    lookupFilter,
    { skip: !isEdit },
  );

  const [createProduct, { isLoading: isCreateLoading }] =
    useCreateProductMutation();

  const [updateProduct, { isLoading: isUpdateLoading }] =
    useUpdateProductMutation();

  const [triggerGetCategories] = useLazyGetCategoriesQuery();
  const { loadCategoryOptions } = useCategoryLoader(triggerGetCategories);

  const [triggerGetBrands] = useLazyGetBrandsQuery();
  const { loadBrandOptions } = useBrandLoader(triggerGetBrands);

  const isLoading = isCreateLoading || isUpdateLoading;

  const {
    control,
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProductForm>({
    resolver: zodResolver(productSchema) as any,
    defaultValues: defaultProduct,
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "stock",
  });

  const stockValues = watch("stock");

  useEffect(() => {
    if (!isOpen) return;

    if (!isEdit) {
      reset(defaultProduct);
      return;
    }

    if (!product?.product) return;
    if (categoryName && areCategoriesLoading) return;
    if (brandName && areBrandsLoading) return;

    const category = categoryName
      ? categoryList?.categories?.find(
          (item: any) =>
            item.category?.trim().toLowerCase() ===
            categoryName.trim().toLowerCase(),
        )
      : undefined;
    const brand = brandName
      ? brandList?.brands?.find(
          (item: any) =>
            item.brand_name?.trim().toLowerCase() ===
            brandName.trim().toLowerCase(),
        )
      : undefined;

    const stockRows = (product.stock ?? []).map((batch: any) => ({
      batch_no: batch.batch_no ?? "",
      pack: batch.pack ?? 1,
      quantity: batch.quantity ?? batch.stock_quantity ?? 0,
      expiry_date: batch.expiry_date ?? "",
      manual_entry: batch.manual_entry ?? false,
      stock_status: batch.stock_status ?? "",
    }));

    reset({
      product_name: product.product.product_name ?? "",
      hsn_code: product.product.hsn_code ?? "",
      category: category
        ? {
            value: Number(category.id),
            label: category.category,
          }
        : null,
      brand: brand
        ? {
            value: Number(brand.id),
            label: brand.brand_name,
          }
        : null,
      mrp: product.product.mrp ?? 0,
      buy_price: product.product.buy_price ?? 0,
      sell_price: product.product.sell_price ?? 0,
      status: product.product.status ?? true,
      stock: stockRows,
    });
  }, [
    isOpen,
    isEdit,
    product,
    categoryName,
    brandName,
    categoryList,
    brandList,
    areCategoriesLoading,
    areBrandsLoading,
    reset,
  ]);

  const handleCategorySaved = (category: any) => {
    setIsCategoryModalOpen(false);
    setCategoryVersion((v) => v + 1);

    if (category?.id) {
      setValue("category", {
        value: Number(category.id),
        label: category.category,
      });
    }
  };

  const handleBrandSaved = (brand: any) => {
    setIsBrandModalOpen(false);
    setBrandVersion((v) => v + 1);

    if (brand?.id) {
      setValue("brand", {
        value: Number(brand.id),
        label: brand.brand_name,
      });
    }
  };

  const onSubmit = async (formData: ProductForm) => {
    const stock = (formData.stock ?? [])
      .filter((batch) => batch.manual_entry !== false)
      .map((batch) => ({
        ...(batch.batch_no?.trim() ? { batch_no: batch.batch_no.trim() } : {}),
        pack: Math.round(batch.pack),
        quantity: Math.round(batch.quantity),
        ...(batch.expiry_date ? { expiry_date: batch.expiry_date } : {}),
      }))
      .filter(
        (batch) => batch.batch_no || batch.expiry_date || batch.quantity > 0,
      );

    const payload = {
      product_name: formData.product_name.trim(),
      ...(formData.hsn_code?.trim()
        ? { hsn_code: formData.hsn_code.trim() }
        : {}),
      category: Number(formData.category?.value),
      ...(formData.brand?.value ? { brand: Number(formData.brand.value) } : {}),
      mrp: roundCurrency(formData.mrp),
      buy_price: roundCurrency(formData.buy_price),
      sell_price: roundCurrency(formData.sell_price),
      status: formData.status,
      stock,
    };

    try {
      let response;

      if (isEdit) {
        response = await updateProduct({
          id: data.id,
          data: payload,
        }).unwrap();
      } else {
        response = await createProduct(payload).unwrap();
      }

      if (response?.success) {
        setToastMessage(
          "success",
          response.message ||
            (isEdit
              ? "Product updated successfully"
              : "Product created successfully"),
        );

        reset(defaultProduct);
        onClose();
      }
    } catch (err: any) {
      if (err?.status === 401) {
        return;
      }
      setToastMessage("error", err?.data?.message || "Something went wrong");
    }
  };

  const onError = (errors: any) => {
    if (import.meta.env.DEV) {
      console.log("Validation errors:", errors);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <>
      <div className="modal-overlay">
        <div className="modal-panel">
          {/* Header */}
          <div className="modal-header">
            <div className="modal-header-left">
              <IconBox
                // icon={<MdAddShoppingCart size={23} />}
                className="icon-box-lg"
              />

              {/* Title */}
              <div className="flex flex-col gap-1 min-w-0">
                <h3 className="m-0 text-lg font-bold text-txt1 text-truncate">
                  {isEdit ? "Edit Product" : "Add Product"}
                </h3>

                <p className="text-xs text-txt2 text-line-clamp-2">
                  Register a product with category, brand, pricing and batch
                  stock detail.
                </p>
              </div>
            </div>

            {/* Close */}
            <CloseIcon
              onClose={() => {
                reset(defaultProduct);
                onClose();
              }}
            />
          </div>

          {/* Form */}
          <form
            className="modal-form"
            onSubmit={handleSubmit(onSubmit, onError)}
          >
            <div className="modal-body scrollbar-hide">
              {/* Product Name */}
              <Input
                label="Product Name / Medicine"
                placeholder="e.g. Paracetamol 500mg"
                {...register("product_name")}
                error={errors?.product_name?.message}
              />

              <Input
                label="HSN Code (Optional)"
                placeholder="e.g. 30049099"
                {...register("hsn_code")}
                error={(errors as any)?.hsn_code?.message}
              />

              <div className="form-grid-2">
                <div className="form-field">
                  <div className="flex items-center justify-between gap-2">
                    <label className="form-label">Category</label>
                    <button
                      type="button"
                      className="text-xs font-semibold text-primary hover:underline"
                      onClick={() => setIsCategoryModalOpen(true)}
                    >
                      Add new
                    </button>
                  </div>
                  <Controller
                    control={control}
                    name="category"
                    render={({ field }) => (
                      <AsyncPaginate
                        key={`category-${categoryVersion}`}
                        value={field.value}
                        onChange={field.onChange}
                        isSearchable
                        loadOptions={loadCategoryOptions}
                        placeholder="Select Category"
                        styles={asyncPaginateStyle(
                          !!errors.category?.value?.message,
                        )}
                      />
                    )}
                  />
                  {errors?.category?.value?.message && (
                    <span className="text-xs text-red">
                      {errors.category.value.message}
                    </span>
                  )}
                </div>

                <div className="form-field">
                  <div className="flex items-center justify-between gap-2">
                    <label className="form-label">
                      Brand{" "}
                      <span className="form-label-optional">(optional)</span>
                    </label>
                    <button
                      type="button"
                      className="text-xs font-semibold text-primary hover:underline"
                      onClick={() => setIsBrandModalOpen(true)}
                    >
                      Add new
                    </button>
                  </div>
                  <Controller
                    control={control}
                    name="brand"
                    render={({ field }) => (
                      <AsyncPaginate
                        key={`brand-${brandVersion}`}
                        value={field.value}
                        onChange={field.onChange}
                        isSearchable
                        isClearable
                        loadOptions={loadBrandOptions}
                        placeholder="Select Brand"
                        styles={asyncPaginateStyle(
                          !!errors.brand?.value?.message,
                        )}
                      />
                    )}
                  />
                  {errors?.brand?.value?.message && (
                    <span className="text-xs text-red">
                      {errors.brand.value?.message}
                    </span>
                  )}
                </div>
              </div>

              {/* Pricing */}
              <div className="form-grid-3">
                <Input
                  type="number"
                  label="MRP"
                  min={0}
                  step="0.01"
                  placeholder="e.g. 304.34"
                  error={errors.mrp?.message}
                  {...register("mrp", { valueAsNumber: true })}
                />

                <Input
                  type="number"
                  label="Buy Price [1 Unit]"
                  min={0}
                  step="0.01"
                  placeholder="e.g. 265.34"
                  error={errors.buy_price?.message}
                  {...register("buy_price", { valueAsNumber: true })}
                />

                <Input
                  type="number"
                  label="Sell Price [1 Unit]"
                  min={0}
                  step="0.01"
                  placeholder="e.g. 304.34"
                  error={errors.sell_price?.message}
                  {...register("sell_price", { valueAsNumber: true })}
                />
              </div>

              {/* Stock batches */}
              <div className="stock-batch-section">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="stock-batch-head-text">
                    <p className="text-sm font-semibold text-txt1">
                      Stock / Batch
                    </p>
                    <p className="text-xs text-txt3">
                      Batch from purchase is read-only. Manual batches can be
                      edited here.
                    </p>
                  </div>

                  <Button
                    type="button"
                    variant="secondary"
                    className="stock-batch-add-btn"
                    onClick={() => append({ ...defaultStockBatch })}
                  >
                    <PlusCircle size={18} />
                    Add Batch
                  </Button>
                </div>

                <div className="flex flex-col gap-3">
                  {fields.length === 0 && (
                    <p className="stock-batch-empty">
                      No batch added yet. Click &quot;Add Batch&quot; to create
                      one, or manage stock later through purchases.
                    </p>
                  )}

                  {fields.map((field, index) => {
                    const row = stockValues?.[index];
                    const isManual = row?.manual_entry !== false;
                    const statusMeta = getStockStatusMeta(row?.stock_status);
                    const showStatus = Boolean(row?.stock_status);

                    return (
                      <div key={field.id} className="stock-batch-row">
                        <div className="flex flex-wrap items-center justify-between gap-2 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 min-w-0">
                            <StatusCard
                              status={
                                isManual ? "Manual Entry" : "Purchase Entry"
                              }
                              color={isManual ? "blue" : "orange"}
                            />
                            {showStatus && (
                              <StatusCard
                                status={statusMeta.label}
                                color={statusMeta.color}
                                isShow
                              />
                            )}
                          </div>

                          {/* {isEdit || !isManual ? (
                            !isManual && (
                              <span className="stock-batch-readonly">
                                Read-only (managed via purchase)
                              </span>
                            )
                          ) : (
                            <button
                              type="button"
                              className="stock-batch-remove-btn"
                              title="Remove batch"
                              aria-label="Remove batch"
                              onClick={() => remove(index)}
                            >
                              <Trash2 size={16} />
                              Remove
                            </button>
                          )} */}
                        </div>

                        <div className="stock-batch-fields">
                          <Input
                            label="Batch No"
                            placeholder="e.g. B-1001"
                            disabled={!isManual}
                            {...register(`stock.${index}.batch_no`)}
                            error={errors.stock?.[index]?.batch_no?.message}
                          />

                          <Input
                            type="number"
                            label="Pack Size"
                            placeholder="1"
                            min={1}
                            step={1}
                            disabled={!isManual}
                            error={errors.stock?.[index]?.pack?.message}
                            {...register(`stock.${index}.pack`, {
                              valueAsNumber: true,
                            })}
                          />

                          <Input
                            type="number"
                            label="Quantity"
                            placeholder="0"
                            min={0}
                            step={1}
                            disabled={!isManual}
                            error={errors.stock?.[index]?.quantity?.message}
                            {...register(`stock.${index}.quantity`, {
                              valueAsNumber: true,
                            })}
                          />

                          <Input
                            type="date"
                            label="Expiry Date"
                            disabled={!isManual}
                            {...register(`stock.${index}.expiry_date`)}
                            error={errors.stock?.[index]?.expiry_date?.message}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Status */}
              <Controller
                control={control}
                name="status"
                render={({ field }) => (
                  <StatusToggleCard
                    titile="Active Product"
                    value={field.value}
                    description={
                      field.value
                        ? "Product is visible and available for stock."
                        : "Product is hidden and not available for stock."
                    }
                    onChange={field.onChange}
                  />
                )}
              />
            </div>

            {/* Footer */}
            <div className="modal-footer">
              <Button
                variant="outline"
                className="modal-footer-btn"
                onClick={() => {
                  reset(defaultProduct);
                  onClose();
                }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                type="submit"
                className="modal-footer-btn"
                loading={isLoading}
                disabled={isLoading}
              >
                <CircleCheck size={18} />
                {isEdit ? "Update Product" : "Register Product"}
              </Button>
            </div>
          </form>
        </div>
      </div>

      <AddCategory
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        onSaved={handleCategorySaved}
      />
      <AddBrand
        isOpen={isBrandModalOpen}
        onClose={() => setIsBrandModalOpen(false)}
        onSaved={handleBrandSaved}
      />
    </>
  );
}
