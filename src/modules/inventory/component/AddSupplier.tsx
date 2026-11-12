import { Check, CircleCheck, Tag, User, User2, X } from "lucide-react";
import Input from "../../../components/ui/Input";
import StatusToggleCard from "../../../components/ui/StatusToggleCard";
import CloseIcon from "../../../components/ui/CloseIcon";
import Button from "../../../components/ui/Button";
import Textarea from "../../../components/ui/TextArea";
// import { HiOutlineUserGroup } from "react-icons/hi2";
import { ModalProps } from "../../../utils/type";
import IconBox from "../../../components/ui/IconBox";
import {
  useCreateSupplierMutation,
  useUpdateSupplierMutation,
} from "../../../api/featutres/inventryFeatures/inventryApi/brandCategorySupplierApi";
import { Controller, useForm } from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { setToastMessage } from "../../../helper/helper";
import {
  SupplierForm,
  supplierSchema,
} from "../../../api/featutres/inventryFeatures/inventrySchema/brandCategorySupplierSchema";

export default function AddSupplier({ onClose, isOpen, data }: ModalProps) {
  const [createSupplier, { isLoading: isCreateLoading }] =
    useCreateSupplierMutation();

  const [updateSupplier, { isLoading: isUpdateLoading }] =
    useUpdateSupplierMutation();

  const isLoading = isCreateLoading || isUpdateLoading;
  const isEdit = Boolean(data?.id);

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SupplierForm>({
    resolver: zodResolver(supplierSchema) as any,
    defaultValues: {
      supplier_name: "",
      address: "",
      primary_no: "",
      secondary_no: "",
      status: true,
    },
  });

  useEffect(() => {
    if (data) {
      reset({
        supplier_name: data.supplier_name ?? "",
        primary_no: data.primary_no ?? "",
        secondary_no: data.secondary_no ?? "",
        address: data.address ?? "",
        status: data.status ?? true,
      });
    } else {
      reset({
        supplier_name: "",
        address: "",
        primary_no: "",
        secondary_no: "",
        status: true,
      });
    }
  }, [data, reset]);

  const handleFormSubmit = async (formData: SupplierForm) => {
    try {
      let response;
      const payload = {
        supplier_name: formData.supplier_name,
        primary_no: formData.primary_no,
        address: formData.address,
        status: formData.status,

        ...(formData.secondary_no?.trim()
          ? { secondary_no: formData.secondary_no.trim() }
          : {}),
      };

      if (isEdit) {
        response = await updateSupplier({
          id: data.id,
          data: payload,
        }).unwrap();
      } else {
        response = await createSupplier(payload).unwrap();
      }

      if (response?.success) {
        setToastMessage(
          "success",
          response.message ||
            (isEdit
              ? "Supplier updated successfully"
              : "Supplier created successfully"),
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
      <div className="entity-modal entity-modal-md">
        {/* Header */}
        <div className="entity-modal-head">
          <div className="flex items-start justify-between gap-5 ">
            <div className="flex items-start gap-4">
              {/* Icon */}

              <IconBox
                // icon={<HiOutlineUserGroup size={23} strokeWidth={2} />}
                className="icon-box-lg"
              />

              {/* Title */}
              <div className="flex flex-col gap-1">
                <h3 className="text-lg font-bold text-txt1    ">
                  {isEdit ? "Edit Supplier" : "Add Supplier"}
                </h3>

                <p className=" text-xs text-txt2">
                  Register a new supplier/vendor with contact numbers and
                  address.
                </p>
              </div>
            </div>

            {/* Close */}
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
          {/* Brand Name */}
          <Input
            label="Supplier Name"
            placeholder="e.g. Medico Wholesale Distributors"
            isRequired
            {...register("supplier_name")}
            error={errors.supplier_name?.message}
          />
          <div className="form-grid-2">
            <Input
              label="Primary Phone"
              placeholder="e.g. 9876543210"
              isRequired
              type="number"
              {...register("primary_no")}
              error={errors.primary_no?.message}
            />
            <Input
              label="Secondary Phone (Optional)"
              type="number"
              placeholder="e.g. 9876543210"
              {...register("secondary_no")}
              error={errors.secondary_no?.message}
            />
          </div>
          <Textarea
            label="Office / Billing Address"
            placeholder="Enter complete address including city and pin code"
            isRequired
            {...register("address")}
            error={errors.address?.message}
          />
          {/* Status */}
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
            >
              Cancel
            </Button>

            <Button
              variant="primary"
              type="submit"
              disabled={isLoading}
              loading={isLoading}
              className="btn-round-lg"
            >
              <CircleCheck size={18} />
              {isEdit ? "Update Supplier" : "Register Supplier"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
