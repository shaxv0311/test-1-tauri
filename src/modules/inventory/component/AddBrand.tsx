import { CircleCheck } from "lucide-react";
import Input from "../../../components/ui/Input";
import StatusToggleCard from "../../../components/ui/StatusToggleCard";
import CloseIcon from "../../../components/ui/CloseIcon";
import Button from "../../../components/ui/Button";
// import { CiShoppingTag } from "react-icons/ci";
import { ModalProps } from "../../../utils/type";
import IconBox from "../../../components/ui/IconBox";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  BrandForm,
  brandSchema,
} from "../../../api/featutres/inventryFeatures/inventrySchema/brandCategorySupplierSchema";
import {
  useCreateBrandMutation,
  useUpdateBrandMutation,
} from "../../../api/featutres/inventryFeatures/inventryApi/brandCategorySupplierApi";
import { useEffect } from "react";
import { setToastMessage } from "../../../helper/helper";

export default function AddBrand({
  onClose,
  isOpen,
  data: selectedBrand,
  onSaved,
}: ModalProps) {
  const [createBrand, { isLoading: isCreateLoading }] =
    useCreateBrandMutation();

  const [updateBrand, { isLoading: isUpdateLoading }] =
    useUpdateBrandMutation();

  const isLoading = isCreateLoading || isUpdateLoading;
  const isEdit = Boolean(selectedBrand?.id);

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BrandForm>({
    resolver: zodResolver(brandSchema) as any,
    defaultValues: {
      brand_name: "",
      status: true,
    },
  });

  // Populate form when editing
  useEffect(() => {
    if (selectedBrand) {
      reset({
        brand_name: selectedBrand.brand_name,
        status: selectedBrand.status,
      });
    } else {
      reset({
        brand_name: "",
        status: true,
      });
    }
  }, [selectedBrand, reset]);

  const handleFormSubmit = async (formData: BrandForm) => {
    try {
      let response;

      if (selectedBrand?.id) {
        // Update
        response = await updateBrand({
          id: selectedBrand.id,
          data: formData,
        }).unwrap();
      } else {
        // Create
        response = await createBrand(formData).unwrap();
      }

      if (response?.success) {
        setToastMessage(
          "success",
          response.message ||
            (selectedBrand
              ? "Brand updated successfully"
              : "Brand created successfully"),
        );

        reset();
        onSaved?.(response?.data?.brand);
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
                // icon={<CiShoppingTag size={23} strokeWidth={1.5} />}
                className="icon-box-lg"
              />

              <div className="flex flex-col gap-1">
                <h3 className="text-lg font-bold text-txt1">
                  {isEdit ? "Edit Brand" : "Add Brand"}
                </h3>

                <p className="text-xs text-txt2">
                  {isEdit
                    ? "Update the brand details."
                    : "Create a new brand to categorize your inventory products."}
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
            label="Brand Name"
            placeholder="e.g. Cipla, Sun Pharma, Dr. Reddy's"
            {...register("brand_name")}
            error={errors.brand_name?.message}
          />

          <Controller
            control={control}
            name="status"
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
              variant="primary"
              type="submit"
              className="btn-round-lg"
              disabled={isLoading}
              loading={isLoading}
            >
              <CircleCheck size={18} />

              {isEdit ? "Update Brand" : "Create Brand"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
