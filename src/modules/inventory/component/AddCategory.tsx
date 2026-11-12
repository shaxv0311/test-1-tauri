import { CircleCheck, LayoutGrid } from "lucide-react";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import Input from "../../../components/ui/Input";
import StatusToggleCard from "../../../components/ui/StatusToggleCard";
import CloseIcon from "../../../components/ui/CloseIcon";
import Button from "../../../components/ui/Button";
import IconBox from "../../../components/ui/IconBox";

import { ModalProps } from "../../../utils/type";
import { setToastMessage } from "../../../helper/helper";

import {
  CategoryForm,
  categorySchema,
} from "../../../api/featutres/inventryFeatures/inventrySchema/brandCategorySupplierSchema";

import {
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
} from "../../../api/featutres/inventryFeatures/inventryApi/brandCategorySupplierApi";

export default function AddCategory({
  onClose,
  isOpen,
  data,
  onSaved,
}: ModalProps) {
  const [createCategory, { isLoading: isCreateLoading }] =
    useCreateCategoryMutation();

  const [updateCategory, { isLoading: isUpdateLoading }] =
    useUpdateCategoryMutation();

  const isLoading = isCreateLoading || isUpdateLoading;
  const isEdit = Boolean(data?.id);

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CategoryForm>({
    resolver: zodResolver(categorySchema) as any,
    defaultValues: {
      category: "",
      status: true,
    },
  });

  // Populate / reset form
  useEffect(() => {
    if (data) {
      reset({
        category: data.category,
        status: data.status,
      });
    } else {
      reset({
        category: "",
        status: true,
      });
    }
  }, [data, reset]);

  const handleFormSubmit = async (formData: CategoryForm) => {
    try {
      let response;

      if (isEdit) {
        response = await updateCategory({
          id: data.id,
          data: formData,
        }).unwrap();
      } else {
        response = await createCategory(formData).unwrap();
      }

      if (response?.success) {
        setToastMessage(
          "success",
          response.message ||
            (isEdit
              ? "Category updated successfully"
              : "Category created successfully"),
        );

        reset();
        onSaved?.(response?.data?.category);
        onClose();
      }
    } catch (error: any) {
      if (error?.status === 401) {
        return;
      }
      setToastMessage("error", error?.data?.message || "Something went wrong");
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
    <div className="modal-overlay">
      <div className="entity-modal">
        {/* Header */}
        <div className="entity-modal-head">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <IconBox
                icon={<LayoutGrid size={23} strokeWidth={1.8} />}
                className="icon-box-lg"
              />

              <div className="flex flex-col gap-1">
                <h3 className="text-lg font-bold text-txt1">
                  {isEdit ? "Edit Category" : "Add Category"}
                </h3>

                <p className="text-xs text-txt2">
                  {isEdit
                    ? "Update the product category details."
                    : "Add a new product category for easier inventory filtering."}
                </p>
              </div>
            </div>

            <CloseIcon
              onClose={() => {
                reset();
                onClose();
              }}
            />
          </div>
        </div>

        {/* Form */}
        <form
          className="flex flex-col gap-5"
          onSubmit={handleSubmit(handleFormSubmit, onError)}
        >
          <Input
            label="Category Name"
            placeholder="e.g. Tablets, Syrups, Ointments..."
            isRequired
            {...register("category")}
            error={errors.category?.message}
          />

          <Controller
            name="status"
            control={control}
            render={({ field }) => (
              <StatusToggleCard
                titile="Status"
                value={field.value}
                onChange={field.onChange}
                description={
                  field.value
                    ? "Active & available for use"
                    : "Inactive & unavailable for use"
                }
              />
            )}
          />

          {/* Footer */}
          <div className="entity-modal-foot">
            <Button
              type="button"
              variant="outline"
              className="btn-round-lg"
              onClick={() => {
                reset();
                onClose();
              }}
              disabled={isLoading}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              variant="primary"
              className="btn-round-lg"
              disabled={isLoading}
              loading={isLoading}
            >
              <CircleCheck size={18} />

              {isEdit ? "Update Category" : "Create Category"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
